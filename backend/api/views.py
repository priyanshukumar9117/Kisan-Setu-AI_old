import os
import tempfile
import uuid
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import UserSettings, FarmProfile, ChatMessage
from llm.generator import generate_response
from rag.retriever import retrieve_context
from stt.transcriber import transcribe_audio
from tts.speaker import generate_audio
from django.conf import settings


# ─────────────────────────────────────────────
# AUTH ENDPOINTS
# ─────────────────────────────────────────────

@api_view(['POST'])
def register(request):
    """Register a new user. Creates Django User + UserSettings."""
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')
    name = request.data.get('name', '').strip()

    if not username or not password:
        return Response({"error": "Username and password are required"}, status=400)
    if len(password) < 4:
        return Response({"error": "Password must be at least 4 characters"}, status=400)
    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already taken"}, status=409)

    # Create Django user
    user = User.objects.create_user(
        username=username,
        password=password,
        first_name=name,
    )

    # Create UserSettings linked to this user
    user_id = f"user_{username}"
    user_settings = UserSettings.objects.create(
        user_id=user_id,
        auth_user=user,
    )

    return Response({
        "status": "success",
        "user_id": user_id,
        "username": username,
        "name": name,
    })


@api_view(['POST'])
def login_view(request):
    """Login with username and password. Returns user_id and settings."""
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response({"error": "Username and password are required"}, status=400)

    user = authenticate(username=username, password=password)
    if user is None:
        return Response({"error": "Invalid username or password"}, status=401)

    # Get or create UserSettings
    try:
        user_settings = user.settings
    except UserSettings.DoesNotExist:
        user_settings = UserSettings.objects.create(
            user_id=f"user_{username}",
            auth_user=user,
        )

    # Check if farm profile exists
    has_farm_profile = hasattr(user_settings, 'farm_profile')

    return Response({
        "status": "success",
        "user_id": user_settings.user_id,
        "username": username,
        "name": user.first_name,
        "language": user_settings.language,
        "mode": user_settings.mode,
        "has_farm_profile": has_farm_profile,
    })


@api_view(['GET'])
def user_info(request):
    """Get current user info."""
    user_id = request.query_params.get('user_id', '')
    if not user_id:
        return Response({"error": "user_id is required"}, status=400)

    try:
        user_settings = UserSettings.objects.get(user_id=user_id)
        django_user = user_settings.auth_user
        has_farm_profile = hasattr(user_settings, 'farm_profile')

        return Response({
            "status": "success",
            "user_id": user_id,
            "username": django_user.username if django_user else "",
            "name": django_user.first_name if django_user else "",
            "language": user_settings.language,
            "mode": user_settings.mode,
            "has_farm_profile": has_farm_profile,
        })
    except UserSettings.DoesNotExist:
        return Response({"error": "User not found"}, status=404)


# ─────────────────────────────────────────────
# SETTINGS ENDPOINTS (existing)
# ─────────────────────────────────────────────

@api_view(['POST'])
def set_language(request):
    user_id = request.data.get('user_id')
    language = request.data.get('language', 'en')
    if not user_id:
        return Response({"error": "user_id is required"}, status=400)
    user, _ = UserSettings.objects.get_or_create(user_id=user_id)
    user.language = language
    user.save()
    return Response({"status": "success", "language": language})

@api_view(['POST'])
def set_mode(request):
    user_id = request.data.get('user_id')
    mode = request.data.get('mode', 'text')
    if not user_id:
        return Response({"error": "user_id is required"}, status=400)
    user, _ = UserSettings.objects.get_or_create(user_id=user_id)
    user.mode = mode
    user.save()
    return Response({"status": "success", "mode": mode})

@api_view(['POST'])
def set_tts(request):
    user_id = request.data.get('user_id')
    tts_provider = request.data.get('tts_provider', 'local')
    if not user_id:
        return Response({"error": "user_id is required"}, status=400)
    user, _ = UserSettings.objects.get_or_create(user_id=user_id)
    user.tts_provider = tts_provider
    user.save()
    return Response({"status": "success", "tts_provider": tts_provider})


# ─────────────────────────────────────────────
# CHAT / QUERY ENDPOINTS
# ─────────────────────────────────────────────

@api_view(['POST'])
def query_bot(request):
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({"error": "user_id is required"}, status=400)

    user, _ = UserSettings.objects.get_or_create(user_id=user_id)

    # Update language and mode if provided in the request
    if 'language' in request.data:
        user.language = request.data.get('language')
        user.save()
    if 'mode' in request.data:
        user.mode = request.data.get('mode')
        user.save()

    text = request.data.get('text', '')
    audio_file = request.FILES.get('audio')  # if user sends voice

    # Process audio if sent
    if audio_file:
        temp_audio_path = os.path.join(tempfile.gettempdir(), f"upload_{uuid.uuid4()}.oga")
        with open(temp_audio_path, 'wb+') as destination:
            for chunk in audio_file.chunks():
                destination.write(chunk)

        transcribed_text = transcribe_audio(temp_audio_path)
        if transcribed_text:
            text = transcribed_text

    if not text:
        return Response({"error": "No text or invalid audio provided."}, status=400)

    # 1. Retrieve RAG Document Context
    context = retrieve_context(text, k=3)

    # 2. Get farm profile context if available
    farm_context = ""
    try:
        farm_profile = user.farm_profile
        farm_context = farm_profile.to_context_string()
    except FarmProfile.DoesNotExist:
        pass

    # 3. LLM inference via Ollama (with farm profile context)
    response_text = generate_response(text, context, language=user.language, farm_context=farm_context)

    # 4. Generate voice if Voice Mode is active
    audio_url = ""
    if user.mode == 'voice' or audio_file:
        audio_filename = generate_audio(
            response_text,
            language=user.language,
            provider=user.tts_provider
        )
        if audio_filename:
            # Construct absolute URL for the audio file
            filename = os.path.basename(audio_filename)
            audio_url = request.build_absolute_uri(settings.MEDIA_URL + filename)

    # 5. Save chat messages to database
    ChatMessage.objects.create(user=user, role='user', content=text)
    ChatMessage.objects.create(user=user, role='ai', content=response_text, audio_url=audio_url or None)

    return Response({
        "status": "success",
        "query": text,
        "response_text": response_text,
        "audio_url": audio_url,
        "language": user.language,
        "mode": user.mode
    })


# ─────────────────────────────────────────────
# CHAT HISTORY ENDPOINTS
# ─────────────────────────────────────────────

@api_view(['GET'])
def chat_history(request):
    """Get chat history for a user. Supports pagination via ?limit=N&offset=M."""
    user_id = request.query_params.get('user_id', '')
    limit = int(request.query_params.get('limit', 100))
    offset = int(request.query_params.get('offset', 0))

    if not user_id:
        return Response({"error": "user_id is required"}, status=400)

    try:
        user = UserSettings.objects.get(user_id=user_id)
    except UserSettings.DoesNotExist:
        return Response({"messages": [], "total": 0})

    messages = ChatMessage.objects.filter(user=user).order_by('timestamp')
    total = messages.count()
    messages = messages[offset:offset + limit]

    return Response({
        "messages": [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "audio_url": msg.audio_url or "",
                "timestamp": msg.timestamp.isoformat(),
            }
            for msg in messages
        ],
        "total": total,
    })


@api_view(['POST'])
def clear_chat_history(request):
    """Clear all chat messages for a user."""
    user_id = request.data.get('user_id', '')
    if not user_id:
        return Response({"error": "user_id is required"}, status=400)

    try:
        user = UserSettings.objects.get(user_id=user_id)
        count = ChatMessage.objects.filter(user=user).count()
        ChatMessage.objects.filter(user=user).delete()
        return Response({"status": "success", "deleted": count})
    except UserSettings.DoesNotExist:
        return Response({"status": "success", "deleted": 0})


# ─────────────────────────────────────────────
# FARM PROFILE ENDPOINTS
# ─────────────────────────────────────────────

@api_view(['GET', 'POST', 'PUT'])
def farm_profile(request):
    """Get, create, or update farm profile."""
    if request.method == 'GET':
        user_id = request.query_params.get('user_id', '')
        if not user_id:
            return Response({"error": "user_id is required"}, status=400)

        try:
            user = UserSettings.objects.get(user_id=user_id)
            profile = user.farm_profile
            return Response({
                "status": "success",
                "profile": {
                    "farmer_name": profile.farmer_name,
                    "district": profile.district,
                    "village": profile.village,
                    "farm_size": profile.farm_size,
                    "primary_crops": profile.primary_crops,
                    "soil_type": profile.soil_type,
                    "irrigation_source": profile.irrigation_source,
                }
            })
        except UserSettings.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        except FarmProfile.DoesNotExist:
            return Response({"status": "success", "profile": None})

    # POST / PUT - Create or update
    user_id = request.data.get('user_id', '')
    if not user_id:
        return Response({"error": "user_id is required"}, status=400)

    user, _ = UserSettings.objects.get_or_create(user_id=user_id)
    profile, created = FarmProfile.objects.get_or_create(user=user)

    # Update fields
    profile.farmer_name = request.data.get('farmer_name', profile.farmer_name)
    profile.district = request.data.get('district', profile.district)
    profile.village = request.data.get('village', profile.village)
    profile.farm_size = request.data.get('farm_size', profile.farm_size)
    profile.primary_crops = request.data.get('primary_crops', profile.primary_crops)
    profile.soil_type = request.data.get('soil_type', profile.soil_type)
    profile.irrigation_source = request.data.get('irrigation_source', profile.irrigation_source)
    profile.save()

    return Response({
        "status": "success",
        "created": created,
        "profile": {
            "farmer_name": profile.farmer_name,
            "district": profile.district,
            "village": profile.village,
            "farm_size": profile.farm_size,
            "primary_crops": profile.primary_crops,
            "soil_type": profile.soil_type,
            "irrigation_source": profile.irrigation_source,
        }
    })


# ─────────────────────────────────────────────
# WEATHER ADVISORY ENDPOINTS
# ─────────────────────────────────────────────

@api_view(['GET'])
def weather_advisory(request):
    """Get weather data + AI farming advisory for a Bihar district."""
    from weather.service import get_weather, build_weather_prompt, get_weather_description
    from weather.bihar_districts import get_all_districts

    district = request.query_params.get('district', '')
    user_id = request.query_params.get('user_id', '')
    language = request.query_params.get('language', 'en')

    # If no district specified, try to get from farm profile
    if not district and user_id:
        try:
            user = UserSettings.objects.get(user_id=user_id)
            profile = user.farm_profile
            district = profile.district
        except (UserSettings.DoesNotExist, FarmProfile.DoesNotExist):
            pass

    if not district:
        return Response({
            "error": "District is required. Set it in your farm profile or pass ?district=Patna",
            "districts": get_all_districts(),
        }, status=400)

    # Fetch weather
    weather_data = get_weather(district)
    if "error" in weather_data:
        return Response(weather_data, status=400)

    # Add human-readable descriptions
    weather_data["current"]["description"] = get_weather_description(
        weather_data["current"]["weathercode"]
    )
    for day in weather_data["forecast"]:
        day["description"] = get_weather_description(day["weathercode"])

    # Generate AI advisory
    weather_prompt = build_weather_prompt(weather_data, language)
    advisory = generate_response(weather_prompt, "", language=language)

    return Response({
        "status": "success",
        "weather": weather_data,
        "advisory": advisory,
        "districts": get_all_districts(),
    })


# ─────────────────────────────────────────────
# MANDI PRICES ENDPOINTS
# ─────────────────────────────────────────────

@api_view(['GET'])
def mandi_prices(request):
    """Get mandi (market) prices for Bihar commodities."""
    from mandi.service import get_mandi_prices, get_fallback_prices, get_available_commodities, get_available_districts

    commodity = request.query_params.get('commodity', '')
    district = request.query_params.get('district', '')
    limit = int(request.query_params.get('limit', 50))

    # Fetch from API
    result = get_mandi_prices(
        commodity=commodity or None,
        district=district or None,
        limit=limit,
    )

    # If API failed, use fallback data
    if result.get("error") and result.get("fallback"):
        result = get_fallback_prices()

    result["available_commodities"] = get_available_commodities()
    result["available_districts"] = get_available_districts()

    return Response(result)


# ─────────────────────────────────────────────
# DISEASE DETECTION ENDPOINTS
# ─────────────────────────────────────────────

@api_view(['POST'])
def detect_disease(request):
    """Upload a crop image for disease detection."""
    from disease.detector import detect_disease as run_detection, build_treatment_prompt

    image_file = request.FILES.get('image')
    user_id = request.data.get('user_id', '')
    provider = 'huggingface' # Changed back to huggingface
    language = request.data.get('language', 'en')
    mode = request.data.get('mode', 'text')

    print(f"[Disease Detection] Received request - language: {language}, mode: {mode}, user_id: {user_id}")

    if not image_file:
        return Response({"error": "No image file provided"}, status=400)

    # Save uploaded image temporarily
    ext = os.path.splitext(image_file.name)[1] or '.jpg'
    temp_path = os.path.join(tempfile.gettempdir(), f"crop_{uuid.uuid4()}{ext}")
    with open(temp_path, 'wb+') as f:
        for chunk in image_file.chunks():
            f.write(chunk)

    # Also save to media folder for reference
    media_filename = f"disease_{uuid.uuid4()}{ext}"
    media_path = os.path.join(settings.MEDIA_ROOT, media_filename)
    os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
    with open(temp_path, 'rb') as src, open(media_path, 'wb') as dst:
        dst.write(src.read())

    image_url = request.build_absolute_uri(settings.MEDIA_URL + media_filename)

    # Run disease detection
    result = run_detection(temp_path, provider=provider)

    if "error" in result:
        return Response({
            "status": "error",
            "error": result["error"],
            "image_url": image_url,
        }, status=500)

    # Generate treatment advice using LLM in selected language
    treatment_prompt = build_treatment_prompt(result, language)
    treatment_advice = ""
    if treatment_prompt:
        print(f"[Disease Detection] Generating treatment in language: {language}")
        treatment_advice = generate_response(treatment_prompt, "", language=language)

    # Generate audio if voice mode is enabled
    audio_url = ""
    if mode == 'voice' and treatment_advice:
        print(f"[Disease Detection] Voice mode ON - generating TTS audio in language: {language}")
        # Get user's TTS provider preference
        tts_provider = 'edge'
        if user_id:
            try:
                user_settings = UserSettings.objects.get(user_id=user_id)
                tts_provider = user_settings.tts_provider
            except UserSettings.DoesNotExist:
                pass

        audio_filename = generate_audio(
            treatment_advice,
            language=language,
            provider=tts_provider
        )
        if audio_filename:
            filename = os.path.basename(audio_filename)
            audio_url = request.build_absolute_uri(settings.MEDIA_URL + filename)
            print(f"[Disease Detection] TTS audio generated: {audio_url}")
        else:
            print(f"[Disease Detection] TTS audio generation FAILED")
    elif mode != 'voice':
        print(f"[Disease Detection] Voice mode OFF (mode={mode}), skipping TTS")

    # Clean up temp file
    try:
        os.remove(temp_path)
    except OSError:
        pass

    return Response({
        "status": "success",
        "disease": result.get("top_disease", "Unknown"),
        "confidence": result.get("top_confidence", 0),
        "predictions": result.get("predictions", []),
        "is_healthy": result.get("is_healthy", False),
        "treatment": treatment_advice,
        "image_url": image_url,
        "audio_url": audio_url,
        "provider": result.get("provider", provider),
    })


# ─────────────────────────────────────────────
# META ENDPOINTS
# ─────────────────────────────────────────────

@api_view(['GET'])
def get_districts(request):
    """Return list of all Bihar districts."""
    from weather.bihar_districts import get_all_districts
    return Response({"districts": get_all_districts()})
