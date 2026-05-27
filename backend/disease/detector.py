"""
Crop Disease Detection service.
Supports two backends:
  1. HuggingFace local model (default) - runs offline
  2. Google Gemini Vision API (optional) - better accuracy

Usage:
    from disease.detector import detect_disease
    result = detect_disease("/path/to/leaf_image.jpg", provider="gemini")
"""
import os
import json
import requests
from pathlib import Path

# Lazy-loaded pipeline for HuggingFace
_hf_classifier = None


def _get_hf_classifier():
    """Lazy-load the HuggingFace image classification pipeline."""
    global _hf_classifier
    if _hf_classifier is None:
        try:
            from transformers import pipeline, AutoImageProcessor
            print("[Disease Detector] Loading HuggingFace model... (first time may take a while)")
            processor = AutoImageProcessor.from_pretrained("google/mobilenet_v2_1.0_224")
            _hf_classifier = pipeline(
                "image-classification",
                model="linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification",
                image_processor=processor,
            )
            print("[Disease Detector] Model loaded successfully.")
        except Exception as e:
            print(f"[Disease Detector] Failed to load HuggingFace model: {e}")
            return None
    return _hf_classifier


def detect_with_huggingface(image_path):
    """
    Detect plant disease using HuggingFace local model.
    Returns list of predictions: [{"label": "...", "score": 0.95}, ...]
    """
    classifier = _get_hf_classifier()
    if classifier is None:
        return {"error": "HuggingFace model not available. Install: pip install transformers torch Pillow"}

    try:
        from PIL import Image
        image = Image.open(image_path).convert("RGB")
        results = classifier(image)

        # Parse labels: "Tomato___Late_blight" → "Tomato - Late Blight"
        parsed = []
        for r in results[:5]:  # Top 5 predictions
            label = r["label"]
            # Clean up label format
            parts = label.replace("___", " - ").replace("_", " ")
            parsed.append({
                "disease": parts,
                "raw_label": label,
                "confidence": round(r["score"] * 100, 2),
            })

        return {
            "predictions": parsed,
            "top_disease": parsed[0]["disease"] if parsed else "Unknown",
            "top_confidence": parsed[0]["confidence"] if parsed else 0,
            "provider": "huggingface",
        }

    except Exception as e:
        return {"error": f"Disease detection failed: {str(e)}"}


def detect_with_gemini(image_path):
    """
    Detect plant disease using Google Gemini Vision API.
    Requires GEMINI_API_KEY in environment.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return {"error": "GEMINI_API_KEY not set. Get one from ai.google.dev"}

    try:
        import base64


        # Read and encode image
        with open(image_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode("utf-8")

        # Determine MIME type
        ext = Path(image_path).suffix.lower()
        mime_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
        mime_type = mime_map.get(ext, "image/jpeg")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key={api_key}"
        
        payload = {
            "contents": [{
                "parts": [
                    {"text": (
                        "You are an expert agricultural plant pathologist. "
                        "Analyze this image of a crop/plant leaf and identify any disease. "
                        "Respond in JSON format with these fields: "
                        '{"disease": "name of disease", "confidence": 85, '
                        '"plant": "plant name", "symptoms": ["symptom1", "symptom2"], '
                        '"is_healthy": false}. '
                        "If the plant looks healthy, set is_healthy to true. "
                        "Only respond with the JSON, no other text."
                    )},
                    {"inline_data": {"mime_type": mime_type, "data": image_data}}
                ]
            }]
        }

        import time
        max_retries = 3
        for attempt in range(max_retries):
            response = requests.post(url, json=payload, timeout=30)
            if response.status_code in [429, 503] and attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff: 1s, 2s
                continue
            response.raise_for_status()
            break
        
        result = response.json()

        # Parse Gemini response
        text = result["candidates"][0]["content"]["parts"][0]["text"]
        # Strip markdown code fences if present
        text = text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        gemini_result = json.loads(text)

        return {
            "predictions": [{
                "disease": gemini_result.get("disease", "Unknown"),
                "confidence": gemini_result.get("confidence", 0),
            }],
            "top_disease": gemini_result.get("disease", "Unknown"),
            "top_confidence": gemini_result.get("confidence", 0),
            "plant": gemini_result.get("plant", "Unknown"),
            "symptoms": gemini_result.get("symptoms", []),
            "is_healthy": gemini_result.get("is_healthy", False),
            "provider": "gemini",
        }

    except json.JSONDecodeError:
        return {"error": "Failed to parse Gemini response"}
    except Exception as e:
        return {"error": f"Gemini Vision detection failed: {str(e)}"}


def detect_disease(image_path, provider="huggingface"):
    """
    Main entry point for disease detection.
    
    Args:
        image_path: Path to the crop/leaf image
        provider: "huggingface" or "gemini"
    
    Returns:
        dict with disease predictions and metadata
    """
    if provider == "gemini":
        return detect_with_gemini(image_path)
    else:
        return detect_with_huggingface(image_path)


def build_treatment_prompt(disease_result, language="en"):
    """
    Build a prompt for the LLM to generate treatment advice
    based on disease detection results.
    """
    if "error" in disease_result:
        return ""

    disease = disease_result.get("top_disease", "Unknown")
    confidence = disease_result.get("top_confidence", 0)
    symptoms = disease_result.get("symptoms", [])

    symptom_text = f" Observed symptoms: {', '.join(symptoms)}." if symptoms else ""

    # Build language-specific output instruction
    lang_map = {
        'hi': 'Hindi (हिन्दी)',
        'bho': 'Bhojpuri (भोजपुरी)',
        'en': 'English'
    }
    lang_name = lang_map.get(language, 'English')

    lang_output_rules = {
        'en': "Write your ENTIRE response in English only.",
        'hi': "अपना पूरा जवाब हिंदी (देवनागरी लिपि) में लिखें। कोई भी अंग्रेजी शब्द न लिखें। Write your ENTIRE response in Hindi (Devanagari script) only. Do NOT use any English.",
        'bho': "अपना पूरा जवाब भोजपुरी (देवनागरी लिपि) में लिखीं। कोई भी अंग्रेजी शब्द मत लिखीं। Write your ENTIRE response in Bhojpuri (Devanagari script) only. Do NOT use any English.",
    }
    lang_instruction = lang_output_rules.get(language, lang_output_rules['en'])

    return (
        f"A farmer in Bihar has uploaded a photo of their crop. "
        f"The AI disease detection model identified: '{disease}' "
        f"with {confidence}% confidence.{symptom_text}\n\n"
        f"Please provide:\n"
        f"1. A brief explanation of this disease\n"
        f"2. Organic/natural treatment methods\n"
        f"3. Chemical treatment options (with specific pesticide names available in Bihar)\n"
        f"4. Prevention tips for future crops\n"
        f"5. Whether the farmer should contact their local Krishi Vigyan Kendra (KVK)\n\n"
        f"Keep the response practical and farmer-friendly.\n\n"
        f"CRITICAL LANGUAGE REQUIREMENT: {lang_instruction}\n"
        f"You MUST respond in {lang_name} language ONLY. This is mandatory."
    )
