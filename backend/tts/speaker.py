import os
import uuid
import asyncio
from django.conf import settings
from gtts import gTTS
import pyttsx3
import edge_tts

# Language mapping for Edge TTS
EDGE_VOICES = {
    'en': 'en-US-AriaNeural',  # High quality English voice
    'hi': 'hi-IN-MadhurNeural',  # Hindi voice
    'bho': 'hi-IN-MadhurNeural'  # Bhojpuri fallback to Hindi
}

async def generate_tts_edge(text: str, language: str) -> str:
    """Generate TTS using Microsoft Edge TTS (highest quality, free)."""
    try:
        voice = EDGE_VOICES.get(language, 'en-US-AriaNeural')
        temp_file = os.path.join(settings.MEDIA_ROOT, f"kisan_{uuid.uuid4()}.mp3")

        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(temp_file)
        return temp_file
    except Exception as e:
        print(f"Edge TTS error: {e}")
        return ""

def generate_tts_edge_sync(text: str, language: str) -> str:
    """Synchronous wrapper for Edge TTS."""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(generate_tts_edge(text, language))
        loop.close()
        return result
    except Exception as e:
        print(f"Edge TTS sync wrapper error: {e}")
        return ""

def generate_tts_google(text: str, language: str) -> str:
    """Generate TTS using Google gTTS and return file path."""
    # Fallback for Bhojpuri to Hindi for gTTS
    gtts_lang = 'hi' if language == 'bho' else language
    try:
        tts = gTTS(text=text, lang=gtts_lang, slow=False)
        temp_file = os.path.join(settings.MEDIA_ROOT, f"kisan_{uuid.uuid4()}.mp3")
        tts.save(temp_file)
        return temp_file
    except Exception as e:
        print(f"gTTS error: {e}")
        return ""

def generate_tts_local(text: str, language: str) -> str:
    """Generate TTS using local pyttsx3 offline."""
    # Note: pyttsx3 depends on system voices which might not fully support 'hi' natively.
    # We will just generate and return the best available voice mapping.
    engine = pyttsx3.init()
    temp_file = os.path.join(settings.MEDIA_ROOT, f"kisan_{uuid.uuid4()}.wav")
    engine.save_to_file(text, temp_file)
    engine.runAndWait()
    return temp_file

def generate_audio(text: str, language: str = 'en', provider: str = 'edge') -> str:
    """Returns the path to the generated audio file."""
    if not text:
        return ""

    # Try Edge TTS first (highest quality)
    if provider == 'edge':
        try:
            result = generate_tts_edge_sync(text, language)
            if result:
                return result
        except Exception as e:
            print(f"Edge TTS failed, falling back to Google TTS: {e}")

    # Fallback to Google TTS
    if provider in ['edge', 'google']:
        try:
            result = generate_tts_google(text, language)
            if result:
                return result
        except Exception as e:
            print(f"Google TTS failed, falling back to local TTS: {e}")

    # Final fallback to local TTS
    return generate_tts_local(text, language)
