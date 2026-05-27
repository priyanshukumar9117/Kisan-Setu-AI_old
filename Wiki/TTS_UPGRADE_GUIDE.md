# TTS Implementation Guide

## Current TTS Setup

The Kisan_Setu AI app now uses **Microsoft Edge TTS** as the primary TTS provider, with automatic fallbacks for maximum reliability.

### TTS Providers (in order of preference):

1. **Edge TTS** (Primary) - Microsoft's Edge browser TTS
   - **Pros**: Highest quality, natural voices, fast, free, supports multiple languages
   - **Cons**: Requires internet for initial setup, minimal async handling
   - **Languages**: English (en-US-AriaNeural), Hindi (hi-IN-MadhurNeural), Bhojpuri (fallback to Hindi)

2. **Google gTTS** (Fallback) - Google Translate TTS
   - **Pros**: Reliable, free, good language support
   - **Cons**: Lower quality than Edge TTS, rate limits, requires internet

3. **pyttsx3** (Final Fallback) - Local system TTS
   - **Pros**: Works offline, no API keys needed
   - **Cons**: Quality depends on system voices, limited language support

## Why Edge TTS is Better

- **Superior Quality**: Neural voices that sound very natural
- **Fast Generation**: Quick response times
- **Free**: No API keys or costs required
- **Language Support**: Excellent support for English, Hindi, and Indian languages
- **Reliability**: Microsoft-backed service with high uptime

## Configuration

Users can select TTS providers in their settings:
- `edge` (default) - Microsoft Edge TTS
- `google` - Google gTTS
- `local` - pyttsx3 local TTS

## Installation

The `edge-tts` package has been added to requirements.txt:

```bash
pip install edge-tts
```

## Future Improvements

Consider these additional TTS options for even better quality:

1. **ElevenLabs** - Premium quality, but paid (free tier available)
2. **Azure Cognitive Services** - Enterprise-grade, free tier
3. **Amazon Polly** - AWS TTS service, free tier
4. **Coqui TTS** - Open-source, runs locally, high quality

## Troubleshooting

If TTS fails:
1. Edge TTS will automatically fallback to Google TTS
2. Google TTS will fallback to local pyttsx3
3. Check internet connection for Edge/Google TTS
4. Ensure system has TTS voices installed for pyttsx3 fallback