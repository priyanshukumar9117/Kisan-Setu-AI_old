# Ollama Model Compatibility Guide

## Tested Models

### ✅ Recommended Models
1. **llama3.2:1b** (Default)
   - Size: ~1.3GB
   - Performance: Fast, low memory
   - Languages: Good for English, basic Hindi support
   - Status: Fully tested and working

2. **llama2:7b**
   - Size: ~3.8GB
   - Performance: Moderate
   - Languages: Better multilingual support
   - Status: Compatible

3. **mistral:latest**
   - Size: ~4.1GB
   - Performance: Good quality responses
   - Languages: Decent multilingual
   - Status: Compatible

### ⚠️ Model Names to Use
- **Qwen**: Use `qwen:4b` or `qwen2:4b` (NOT `qwen3:4b`)
  - `qwen3:4b` does not exist in Ollama registry
  - Check available Qwen versions: `ollama list`

- **Llama**: Use `llama2:7b` or `llama3.2:1b` (exact names matter)

---

## Troubleshooting

### Error: "Model not found"
```bash
# Check available models
ollama list

# Pull the correct model
ollama pull llama3.2:1b
ollama pull mistral
ollama pull qwen:4b
```

### Error: "Connection refused" or "Could not connect to Ollama"
1. Ensure Ollama is running:
```bash
ollama serve
```

2. Check Ollama is accessible:
```bash
curl http://localhost:11434/api/tags
```

### Error: "Request timeout"
- Model is too large for your system RAM
- Use a smaller model (1b or 4b instead of 7b/13b)
- Increase timeout in `.env`: `OLLAMA_TIMEOUT=120`

### Slow responses or low quality Hindi/Bhojpuri
- Ensure you're using a model with good multilingual support
- Larger models (7b+) typically provide better quality
- Try `mistral` or `mistral-medium` for better responses

---

## Setting Model in .env

```bash
# Default (fast, low memory)
OLLAMA_MODEL=llama3.2:1b

# Better multilingual support
OLLAMA_MODEL=llama2:7b

# Good balance
OLLAMA_MODEL=mistral

# Correct Qwen model (if available)
OLLAMA_MODEL=qwen:4b
```

---

## Updated Error Handling (v2.0)

The `backend/llm/generator.py` now handles:
- ✅ Connection errors (Ollama not running)
- ✅ Response format variations (different models)
- ✅ Timeout errors (slow models)
- ✅ Invalid model responses

Better error messages will help identify the exact issue.

---

## Why `qwen3:4b` Failed

1. **Model name incorrect**: Ollama registry does not have `qwen3:4b`
2. **Available options**:
   - `qwen:4b` - QWen 4-billion parameter model
   - `qwen2:4b` - QWen 2 version (if available)
   - `qwen2:7b` - Larger version
   - Check with: `ollama list` or `ollama search qwen`

3. **Fix**:
```bash
# Step 1: Pull the correct model
ollama pull qwen:4b

# Step 2: Update .env
OLLAMA_MODEL=qwen:4b

# Step 3: Restart backend and bot
```

---

## Performance Comparison

| Model | Size | Speed | Quality | Memory | Languages |
|-------|------|-------|---------|--------|-----------|
| llama3.2:1b | 1.3GB | Very Fast | Good | 2GB | Basic |
| mistral | 4.1GB | Fast | Very Good | 6GB | Good |
| llama2:7b | 3.8GB | Moderate | Excellent | 8GB | Good |
| qwen:4b | ~2.5GB | Moderate | Good | 4GB | Excellent |

---

## Recommended Setup for Bihar Agricultural Assistant

For best Hindi/Bhojpuri support:
```bash
OLLAMA_MODEL=qwen:4b
# or
OLLAMA_MODEL=mistral
```

Both support multilingual responses better than `llama3.2:1b`.
