from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
import json
from .models import UserPreferences, ChatHistory


def landing(request):
    return render(request, 'frontend/landing.html')


def about(request):
    return render(request, 'frontend/about.html')


@login_required
def dashboard(request):
    user_prefs, _ = UserPreferences.objects.get_or_create(user=request.user)
    context = {'language': user_prefs.language, 'mode': user_prefs.mode}
    return render(request, 'frontend/dashboard.html', context)


@login_required
def chat(request):
    user_prefs, _ = UserPreferences.objects.get_or_create(user=request.user)
    context = {'user_id': request.user.id, 'language': user_prefs.language}
    return render(request, 'frontend/chat.html', context)


@login_required
def profile(request):
    user_prefs, _ = UserPreferences.objects.get_or_create(user=request.user)
    context = {'user_prefs': user_prefs}
    return render(request, 'frontend/profile.html', context)


@login_required
def history(request):
    chat_history = ChatHistory.objects.filter(user=request.user).order_by('-created_at')[:50]
    context = {'chat_history': chat_history}
    return render(request, 'frontend/history.html', context)


@login_required
def calendar(request):
    return render(request, 'frontend/calendar.html')


@login_required
def pest_guide(request):
    return render(request, 'frontend/pest_guide.html')


@login_required
@require_http_methods(["POST"])
def save_preferences(request):
    try:
        data = json.loads(request.body)
        prefs, _ = UserPreferences.objects.get_or_create(user=request.user)
        if 'language' in data:
            prefs.language = data['language']
        if 'mode' in data:
            prefs.mode = data['mode']
        if 'tts_enabled' in data:
            prefs.tts_enabled = data['tts_enabled']
        prefs.save()
        return JsonResponse({'status': 'success', 'message': 'Preferences saved'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@login_required
@require_http_methods(["GET"])
def get_user_prefs(request):
    prefs, _ = UserPreferences.objects.get_or_create(user=request.user)
    return JsonResponse({
        'language': prefs.language,
        'mode': prefs.mode,
        'tts_enabled': prefs.tts_enabled
    })

