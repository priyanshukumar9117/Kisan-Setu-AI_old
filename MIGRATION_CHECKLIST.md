# Code Migration Checklist: production-minimal Support

For your app to work on 512MB RAM (production-minimal), you need to refactor heavy ML operations to use APIs instead.

## ✓ Already Configured
- [x] Django + Django REST Framework (lightweight)
- [x] Python Telegram Bot
- [x] ChromaDB + LangChain (minimal)
- [x] edge-tts (lightweight TTS)
- [x] Gunicorn with 1 worker (memory efficient)

## TODO: Code Changes Required

### 1. **Speech Recognition** (Whisper → Google Speech-to-Text)
**Current**: Using `openai-whisper` (500MB+)
**Needed**: Refactor to use Google Cloud Speech-to-Text API

**Files to check**:
- [ ] `backend/stt/` - Speech-to-text modules
- [ ] Check for `import whisper` statements
- [ ] Look for `.transcribe()` calls

**Migration steps**:
```python
# Before (local)
import whisper
model = whisper.load_model("base")
result = model.transcribe(audio_file)

# After (API)
from google.cloud import speech_v1
client = speech_v1.SpeechClient()
# Use client.recognize() instead
```

**Action**:
```bash
# Setup
pip install google-cloud-speech

# Code changes
grep -r "import whisper" backend/
grep -r "whisper.load_model\|model.transcribe" backend/
```

---

### 2. **Text-to-Speech** (Multiple → edge-tts)
**Current**: Using `gTTS`, `pyttsx3`, possibly others
**Keep**: `edge-tts` (lightweight, good quality)

**Files to check**:
- [ ] `backend/tts/` - Text-to-speech modules
- [ ] Check for `import pyttsx3` or other TTS imports
- [ ] Look for `.synthesize()`, `.speak()` calls

**What's already in production-minimal**:
- ✓ `edge-tts` - Recommended
- ✗ `pyttsx3` - Remove (heavier)
- ✗ `gTTS` - Remove if not critical (API-based but not needed)

**Action**:
```bash
# Find non-edge-tts implementations
grep -r "import gTTS\|import pyttsx3\|from gtts\|from pyttsx3" backend/
```

---

### 3. **Embeddings & Vector Search** (Transformers → API)
**Current**: Using local `sentence-transformers` (400MB+) 
**Needed**: Use API-based embeddings (Google or HuggingFace API)

**Files to check**:
- [ ] `backend/rag/` - RAG and embedding modules
- [ ] Check for `SentenceTransformer` usage
- [ ] Look for `.encode()` calls

**Migration steps**:
```python
# Before (local)
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')
embeddings = model.encode([text1, text2])

# After (Google API)
import google.generativeai as genai
genai.configure(api_key=api_key)
result = genai.embed_content(model="models/embedding-001", content=text)
embeddings = result['embedding']
```

**Action**:
```bash
# Find embedding code
grep -r "SentenceTransformer\|sentence_transformers\|\.encode(" backend/
```

---

### 4. **LLM/Chat** (Local → API)
**Current**: Likely using `transformers` + `torch` for local LLM
**Keep**: `langchain` + API backends (Google Generative AI, etc.)

**Files to check**:
- [ ] `backend/llm/` - Language model modules
- [ ] Check for `transformers` or local model loading
- [ ] Look for `.generate()` or `.invoke()` calls

**Action**:
```bash
# Find local LLM code
grep -r "from transformers\|import transformers\|torch.load\|AutoModel" backend/
```

---

### 5. **Image Processing** (Optional)
**Current**: Using `Pillow` + `imageio-ffmpeg` (kept in production-minimal)
**Status**: ✓ These are acceptable size

**Action**:
```bash
# Check if actually used
grep -r "from PIL\|import PIL\|imageio" backend/
```

---

## API Setup Instructions

### Google Cloud Setup (Recommended)
```bash
# 1. Install
pip install google-cloud-speech google-cloud-texttospeech google-generativeai

# 2. Create project in Google Cloud Console
https://console.cloud.google.com/

# 3. Enable APIs:
# - Cloud Speech-to-Text API
# - Cloud Text-to-Speech API  
# - Google Generative AI API

# 4. Create service account
# - Download JSON credentials

# 5. Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"
```

### Update Backend Code
```bash
# 1. Create wrapper functions in backend/
mkdir -p backend/api_clients
touch backend/api_clients/__init__.py backend/api_clients/google_apis.py

# 2. Implement:
# - speech_to_text(audio_file)
# - text_to_speech(text, lang)
# - get_embeddings(text)
# - generate_response(prompt)

# 3. Update existing modules to use wrappers
grep -r "\.load_model\|\.transcribe\|\.encode\|SentenceTransformer" backend/ | cut -d: -f1 | sort -u
# Then import and use the wrapper functions
```

---

## Testing Checklist

### Local Testing
```bash
# 1. Test with production-minimal deps
./setup_env.sh test-minimal

# 2. Run tests
python manage.py test

# 3. Test critical flows
# - User registration
# - Chat message
# - Bot interaction
```

### Before Deploying to Render
```bash
# 1. Commit all changes
git add .
git commit -m "Refactor for production-minimal: use APIs instead of local ML"

# 2. Verify render.yaml uses production-minimal
grep "production-minimal" render.yaml

# 3. Test deployment locally
python manage.py runserver

# 4. Push to deploy
git push
```

---

## Files to Update

```
backend/
├── stt/
│   ├── views.py          # Replace whisper with Google Speech API
│   └── services.py
├── tts/
│   ├── views.py          # Ensure only edge-tts (remove pyttsx3/gTTS)
│   └── services.py
├── rag/
│   ├── vector_store.py   # Replace SentenceTransformer with API
│   └── embeddings.py
├── llm/
│   ├── chat.py           # Use Google Generative AI API
│   └── models.py         # Remove local model loading
└── api_clients/          # NEW - API wrapper functions
    ├── __init__.py
    ├── google_apis.py    # Google Cloud implementations
    └── huggingface_apis.py # Optional: HuggingFace API
```

---

## Size Reduction Summary

| Component | Before | After | Savings |
|-----------|--------|-------|---------|
| whisper | 500MB | 0MB | 500MB ↓ |
| torch | 800MB | 0MB | 800MB ↓ |
| transformers | 700MB | 0MB | 700MB ↓ |
| **Total** | **2GB+** | **~400MB** | **1.6GB+ ↓** |

This brings you well under 512MB for code + dependencies.

---

## Next Steps

1. [ ] **This week**: Identify all ML usage (grep commands above)
2. [ ] **This week**: Set up Google Cloud project + credentials
3. [ ] **Next week**: Refactor STT module
4. [ ] **Next week**: Refactor embeddings module
5. [ ] **Next week**: Update LLM module
6. [ ] **Before deploy**: Run tests with production-minimal
7. [ ] **Deploy**: `git push` with confidence!

---

## Getting Help

**If stuck on specific module**: 
```bash
# Find what needs Google APIs
grep -r "from transformers\|import whisper\|SentenceTransformer\|torch\." backend/ | head -20
```

**Recommended API docs**:
- [Google Cloud Speech-to-Text](https://cloud.google.com/speech-to-text/docs)
- [Google Cloud Text-to-Speech](https://cloud.google.com/text-to-speech/docs)
- [Google Generative AI](https://ai.google.dev/tutorials/python_quickstart)
- [LangChain Google Integration](https://python.langchain.com/docs/integrations/providers/google)
