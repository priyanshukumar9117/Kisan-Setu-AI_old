import os
import requests
import json

def generate_response(prompt: str, context: str, language: str = 'en', farm_context: str = '') -> str:
    """Generate response using Ollama llama3.2:1b."""
    # Read Ollama url and model from environment variables
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:1b")

    lang_map = {
        'hi': 'Hindi',
        'bho': 'Bhojpuri',
        'en': 'English'
    }
    lang_instr = lang_map.get(language, "English")

    output_policy = {
        'en': "English only. Do not use Hindi, Bhojpuri, or romanized Hindi/Bhojpuri.",
        'hi': "Hindi only, in Devanagari script. Do not use English or romanized Hindi.",
        'bho': "Bhojpuri only, preferably in Devanagari script. Do not use English or romanized Bhojpuri."
    }
    output_instr = output_policy.get(language, "English only. Do not use Hindi or Bhojpuri.")

    # Build farm profile context injection
    farm_profile_section = ""
    if farm_context:
        farm_profile_section = (
            f"IMPORTANT - This farmer's profile: {farm_context}. "
            "Use this information to personalize your response to their specific farm conditions. "
        )

    system_prompt = (
        "You are 'Kisan_Setu', an AI-powered agricultural assistant chatbot designed ONLY for farmers in Bihar, India. "
        f"{farm_profile_section}"
        "Rules: "
        "- Always provide answers based on Bihar-specific conditions (soil, climate, irrigation, government schemes). "
        "- If a query is about another state or general India, redirect the answer to Bihar context. "
        "- If information is not available for Bihar, clearly say: 'This information is not specific to Bihar.' "
        "- Use local context such as: Crops: rice, wheat, maize, pulses; Climate: monsoon-dependent agriculture; Region examples: Patna, Ara, Buxar, Muzaffarpur, Gaya, Darbhanga. "
        "- Prefer Bihar government schemes over central schemes unless necessary. "
        f"- {output_instr} "
        "DO NOT give generic India-wide answers. "
        f"You MUST provide your final response in {lang_instr} language ONLY. "
        "Provide a simple, conversational, easy-to-understand response like you're explaining to a farmer. "
        "DO NOT copy text verbatim from the Context. Instead, paraphrase and explain it naturally in your own words. "
        "Use short sentences and practical advice. If the answer is not in the context, "
        f"say you don't know politely in {lang_instr}."
    )
    
    full_prompt = f"Context:\n{context}\n\nFarmer Query:\n{prompt}"
    
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": full_prompt}
        ],
        "stream": False
    }
    
    try:
        response = requests.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload, timeout=60)
        response.raise_for_status()
        result = response.json()
        
        # Handle different response formats from different Ollama models
        if "message" in result and "content" in result["message"]:
            return result["message"]["content"].strip()
        elif "response" in result:
            # Some models return response directly
            return result["response"].strip()
        else:
            print(f"Unexpected Ollama response format: {result}")
            return "Sorry, I am currently unable to process your request." if language == 'en' else "क्षमा करें, मैं अभी आपके अनुरोध को संसाधित करने में असमर्थ हूं।"
    except requests.exceptions.ConnectionError:
        print(f"Error: Could not connect to Ollama at {OLLAMA_BASE_URL}. Ensure Ollama is running: ollama serve")
        return "Sorry, the AI model is not running. Please start Ollama with: ollama serve" if language == 'en' else "क्षमा करें, AI मॉडल चल नहीं रहा है।"
    except requests.exceptions.Timeout:
        print(f"Error: Ollama request timeout. Model {OLLAMA_MODEL} may be too large or slow.")
        return "Sorry, the model took too long to respond. Try a smaller model." if language == 'en' else "क्षमा करें, मॉडल बहुत धीमा है।"
    except Exception as e:
        print(f"Error calling Ollama with model {OLLAMA_MODEL}: {e}")
        return "Sorry, I am currently unable to process your request." if language == 'en' else "क्षमा करें, मैं अभी आपके अनुरोध को संसाधित करने में असमर्थ हूं।"
