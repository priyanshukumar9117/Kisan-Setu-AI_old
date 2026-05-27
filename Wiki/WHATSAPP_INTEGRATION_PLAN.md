# WhatsApp Integration Plan for Kisan_Sarthi

## Overview
Integrate WhatsApp Business API into the existing Kisan_Sarthi project to provide agricultural assistance via WhatsApp alongside Telegram.

## Current Architecture
- Django REST API backend
- Telegram bot (polling-based)
- Modular components: LLM, RAG, STT, TTS
- User settings stored in Django models

## New Architecture
```
WhatsApp Business API
        ↓
WhatsApp Webhook Handler (New)
        ↓
Django REST API (Existing)
        ↓
LLM + RAG + STT + TTS (Existing)
```

---

## Phase 1: Prerequisites & Setup

### 1.1 WhatsApp Business API Setup
1. **Create Meta Business Account**
   - Go to [business.facebook.com](https://business.facebook.com)
   - Create Business Account
   - Verify business details

2. **Set up WhatsApp Business Account**
   - Apply for WhatsApp Business API access
   - Get approved (may take 1-2 weeks)
   - Receive API credentials:
     - Access Token
     - Phone Number ID
     - Business Account ID

3. **Configure Webhook**
   - Set webhook URL: `https://yourdomain.com/whatsapp/webhook/`
   - Verify token for webhook authentication

### 1.2 Environment Variables
Add to `.env`:
```bash
# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_API_VERSION=v18.0
```

---

## Phase 2: Backend Modifications

### 2.1 Install Dependencies
Add to `requirements.txt`:
```
requests>=2.28.0
cryptography>=3.4.0  # For webhook verification
```

### 2.2 Django Models Update
Update `backend/api/models.py`:
```python
class UserSettings(models.Model):
    # Existing fields...
    platform = models.CharField(max_length=20, default='telegram')  # 'telegram' or 'whatsapp'
    whatsapp_number = models.CharField(max_length=20, blank=True, null=True)
```

### 2.3 Create WhatsApp Handler
Create `backend/whatsapp/` directory:
```
backend/whatsapp/
├── __init__.py
├── views.py          # Webhook handler
├── client.py         # WhatsApp API client
├── utils.py          # Helper functions
```

### 2.4 WhatsApp API Client (`backend/whatsapp/client.py`)
```python
import os
import requests
import json

class WhatsAppClient:
    def __init__(self):
        self.access_token = os.getenv('WHATSAPP_ACCESS_TOKEN')
        self.phone_number_id = os.getenv('WHATSAPP_PHONE_NUMBER_ID')
        self.api_version = os.getenv('WHATSAPP_API_VERSION', 'v18.0')
        self.base_url = f"https://graph.facebook.com/{self.api_version}"

    def send_message(self, to: str, message: str) -> bool:
        """Send text message to WhatsApp user"""
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        data = {
            'messaging_product': 'whatsapp',
            'to': to,
            'type': 'text',
            'text': {'body': message}
        }
        
        response = requests.post(url, headers=headers, json=data)
        return response.status_code == 200

    def send_audio(self, to: str, audio_url: str) -> bool:
        """Send audio message"""
        # Implementation for audio messages
        pass
```

### 2.5 Webhook Handler (`backend/whatsapp/views.py`)
```python
import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from .client import WhatsAppClient
from ..api.views import process_query

whatsapp_client = WhatsAppClient()

@require_GET
def verify_webhook(request):
    """Verify webhook with WhatsApp"""
    mode = request.GET.get('hub.mode')
    token = request.GET.get('hub.verify_token')
    challenge = request.GET.get('hub.challenge')
    
    verify_token = os.getenv('WHATSAPP_VERIFY_TOKEN')
    
    if mode == 'subscribe' and token == verify_token:
        return HttpResponse(challenge)
    return HttpResponse('Verification failed', status=403)

@csrf_exempt
@require_POST
def webhook_handler(request):
    """Handle incoming WhatsApp messages"""
    try:
        data = json.loads(request.body)
        
        for entry in data.get('entry', []):
            for change in entry.get('changes', []):
                if change.get('field') == 'messages':
                    messages = change.get('value', {}).get('messages', [])
                    
                    for message in messages:
                        if message.get('type') == 'text':
                            from_number = message['from']
                            text = message['text']['body']
                            
                            # Process query using existing logic
                            response = process_whatsapp_query(from_number, text)
                            
                            # Send response back
                            whatsapp_client.send_message(from_number, response)
        
        return JsonResponse({'status': 'ok'})
    
    except Exception as e:
        print(f"WhatsApp webhook error: {e}")
        return JsonResponse({'status': 'error'}, status=500)
```

### 2.6 URL Configuration
Update `backend/django_project/urls.py`:
```python
from whatsapp.views import verify_webhook, webhook_handler

urlpatterns = [
    # Existing URLs...
    path('whatsapp/webhook/', webhook_handler, name='whatsapp_webhook'),
    path('whatsapp/webhook/verify/', verify_webhook, name='whatsapp_verify'),
]
```

---

## Phase 3: Integration with Existing Logic

### 3.1 Modify API Views
Update `backend/api/views.py` to handle WhatsApp users:
```python
@api_view(['POST'])
def query_bot(request):
    user_id = request.data.get('user_id')
    platform = request.data.get('platform', 'telegram')  # New parameter
    
    if not user_id:
        return Response({"error": "user_id is required"}, status=400)
        
    user, _ = UserSettings.objects.get_or_create(
        user_id=user_id,
        defaults={'platform': platform}
    )
    
    # Existing logic...
```

### 3.2 WhatsApp Query Processor
Create `backend/whatsapp/processor.py`:
```python
from api.views import process_query
from .client import WhatsAppClient

def process_whatsapp_query(from_number: str, text: str) -> str:
    """Process WhatsApp query using existing backend logic"""
    
    # Create payload for existing API
    payload = {
        'user_id': from_number,
        'platform': 'whatsapp',
        'text': text
    }
    
    # Call existing query processing
    # This will reuse all existing LLM, RAG, STT, TTS logic
    try:
        # Make internal API call or directly call the processing function
        response = process_query_internal(payload)
        return response.get('response_text', 'Sorry, I could not process your request.')
    except Exception as e:
        return f"Sorry, there was an error: {str(e)}"
```

---

## Phase 4: User Experience Features

### 4.1 Welcome Message
Create WhatsApp-specific welcome flow:
- Send initial greeting
- Ask for language preference
- Set up user profile

### 4.2 Media Support
- Handle image uploads (for plant disease detection)
- Support audio messages (voice queries)
- Send audio responses

### 4.3 Interactive Elements
- Use WhatsApp buttons for quick actions
- Implement menu system for settings

---

## Phase 5: Testing & Deployment

### 5.1 Local Testing
1. Use ngrok for webhook tunneling:
```bash
ngrok http 8000
# Use ngrok URL in WhatsApp webhook settings
```

2. Test with your own WhatsApp number

### 5.2 Production Deployment
1. **Server Requirements**:
   - HTTPS certificate (required by WhatsApp)
   - Static IP or domain
   - SSL/TLS encryption

2. **Security**:
   - Webhook signature verification
   - Rate limiting
   - Input validation

3. **Monitoring**:
   - Log WhatsApp API calls
   - Track user interactions
   - Monitor webhook health

---

## Phase 6: Implementation Steps

### Step 1: Environment Setup (1-2 days)
- [ ] Apply for WhatsApp Business API
- [ ] Set up Meta Business account
- [ ] Configure webhook URL
- [ ] Add environment variables

### Step 2: Backend Development (3-4 days)
- [ ] Install dependencies
- [ ] Create WhatsApp client
- [ ] Implement webhook handler
- [ ] Update Django models and URLs
- [ ] Integrate with existing API

### Step 3: Feature Implementation (2-3 days)
- [ ] Add media message support
- [ ] Implement interactive buttons
- [ ] Create welcome flow
- [ ] Add error handling

### Step 4: Testing (2-3 days)
- [ ] Unit tests for WhatsApp client
- [ ] Integration tests with webhook
- [ ] End-to-end testing
- [ ] Load testing

### Step 5: Deployment (1-2 days)
- [ ] Set up production server
- [ ] Configure SSL certificate
- [ ] Deploy application
- [ ] Test production webhook

---

## Cost Considerations

### WhatsApp Business API Costs
- **Setup Fee**: $0 (during beta)
- **Conversation Fee**: ~$0.005 per conversation
- **Message Fee**: Based on destination country

### Infrastructure Costs
- **Server**: $5-20/month (depending on traffic)
- **Domain**: $10-15/year
- **SSL Certificate**: Free (Let's Encrypt)

---

## Challenges & Solutions

### Challenge 1: WhatsApp Approval Process
**Solution**: Start application early, prepare all required documents

### Challenge 2: Webhook Security
**Solution**: Implement signature verification, rate limiting, input sanitization

### Challenge 3: Media Handling
**Solution**: Use WhatsApp's media API, store temporarily, process with existing STT/TTS

### Challenge 4: User Management
**Solution**: Extend existing UserSettings model to support platform field

---

## Success Metrics

- [ ] WhatsApp webhook successfully receives messages
- [ ] Users can send text queries and receive responses
- [ ] Voice messages are transcribed and processed
- [ ] Audio responses are sent back
- [ ] User settings persist across sessions
- [ ] Error handling works properly
- [ ] System handles multiple concurrent users

---

## Next Steps

1. **Start with Prerequisites**: Apply for WhatsApp Business API
2. **Review Code**: Examine existing Telegram bot implementation
3. **Begin Development**: Start with WhatsApp client and webhook handler
4. **Test Incrementally**: Test each component before moving to next

This plan provides a complete roadmap for WhatsApp integration while maintaining compatibility with the existing Telegram bot.</content>
<parameter name="filePath">/Users/priyanshukumar/Desktop/git project/Kisan_Sarthi/Kisan_Sarthi/WHATSAPP_INTEGRATION_PLAN.md