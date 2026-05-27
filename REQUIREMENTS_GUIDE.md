# Requirements Management Guide

This project uses environment-specific requirements files to optimize deployment across different environments.

## Requirements Structure

```
requirements/
├── base.txt                    # Core dependencies (Django, DRF, bot, utilities)
├── development.txt            # Full feature set (all ML libraries)
├── production.txt             # Production with ML stack (for larger instances)
└── production-minimal.txt    # Ultra-minimal for 512MB RAM (Render free tier)
```

## Installation by Environment

### Local Development
Install all dependencies:
```bash
pip install -r requirements/development.txt
```

### Production on Render (512MB RAM - FREE TIER)
The deployment uses `production-minimal.txt` automatically via `render.yaml`.

For **ML operations**, use API-based services instead:
- **Speech-to-Text**: Google Cloud Speech-to-Text API
- **Text-to-Speech**: Google Cloud Text-to-Speech API or edge-tts
- **Embeddings**: Google Generative AI API or Hugging Face API
- **LLM**: Google Generative AI API

### Production on Larger Instance (1GB+ RAM)
Edit `render.yaml` and change:
```yaml
pip install -r requirements/production.txt
```

## Key Differences

| Feature | Base | Production-Minimal | Production | Development |
|---------|------|-------------------|------------|-------------|
| Django & DRF | ✓ | ✓ | ✓ | ✓ |
| RAG & LangChain | ✗ | ✓ | ✓ | ✓ |
| PyTorch/Transformers | ✗ | ✗ | ✓ | ✓ |
| Whisper (Speech) | ✗ | ✗ | ✓ | ✓ |
| TTS Options | ✗ | edge-tts | All | All |
| Size (approx) | ~150MB | ~380MB | ~2GB | ~3GB |

## API Services Recommended for Production

### Google Cloud (Production Recommended)
```bash
pip install google-cloud-speech google-cloud-texttospeech google-generativeai
```

### Environment Variables
```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
GOOGLE_CLOUD_PROJECT=your-project-id
```

## Migration Guide: production.txt → production-minimal.txt

### Before (Heavy)
```python
# models.py - Uses local transformers
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')
embeddings = model.encode(text)
```

### After (API-based)
```python
# models.py - Uses Google API
import google.generativeai as genai
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
# Use genai for embeddings/LLM
```

## Deployment Examples

### Deploy with production-minimal (512MB)
```bash
# Already configured in render.yaml
# Just push to main branch
```

### Deploy with production (1GB+ needed)
1. Edit `render.yaml`:
   - Change `requirements/production-minimal.txt` → `requirements/production.txt`
   - Change `--workers 1` → `--workers 3` (if RAM allows)

2. Deploy:
   ```bash
   git push
   ```

## Troubleshooting

### "Out of memory" Error
- You're using `production.txt` or `development.txt` on 512MB instance
- Solution: Switch to `production-minimal.txt` or upgrade your Render plan

### "Module not found" Error
- The module exists in `development.txt` but not in `production-minimal.txt`
- Solution: Use the Google Cloud API equivalent or upgrade your plan

### Workers Keep Restarting
- Likely memory issue with multiple workers
- `production-minimal.txt` uses `--workers 1` (single worker)
- For multiple workers, upgrade Render plan to 1GB+

## Adding New Dependencies

1. **For all environments**: Add to `requirements/base.txt`
2. **For development only**: Add to `requirements/development.txt`
3. **For production**: 
   - Find a lightweight alternative, OR
   - Use an API-based service, OR
   - Upgrade to a larger instance

## Next Steps

1. ✅ Review [backend code](./backend/) for hardcoded ML dependencies
2. Migrate heavy operations to Google Cloud APIs
3. Test locally with `production-minimal.txt`:
   ```bash
   pip uninstall -r requirements/development.txt -y
   pip install -r requirements/production-minimal.txt
   ```
4. Deploy to Render free tier with confidence
