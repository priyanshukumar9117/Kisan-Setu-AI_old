# Kisan_Setu AI - Advanced Frontend Documentation

## Overview

The advanced frontend for Kisan_Setu AI is a comprehensive, responsive web application built with Django templates, CSS, and vanilla JavaScript. It provides farmers with an intuitive interface to interact with the agricultural AI assistant.

## Features Implemented

### 1. **Pages**
- **Landing Page** (`/web/`) - Introduction and feature showcase
- **Chat Page** (`/web/chat/`) - AI conversation interface with voice input
- **Dashboard** (`/web/dashboard/`) - Real-time weather, crop recommendations, and market prices
- **User Profile** (`/web/profile/`) - Language and preference settings
- **Chat History** (`/web/history/`) - View past conversations
- **Farm Calendar** (`/web/calendar/`) - Monthly farming tasks and recommendations
- **Pest Guide** (`/web/pest-guide/`) - Disease and pest identification with management tips
- **About Page** (`/web/about/`) - Project information and team details

### 2. **Advanced Features**

#### Real-Time Weather Integration
- Uses **Open-Meteo API** (free, no API key required)
- Displays temperature, humidity, and wind speed
- Automatically loads weather for Patna, Bihar
- Can be customized for other locations

**To customize location:**
Edit `/backend/frontend/templates/frontend/dashboard.html`:
```javascript
// Change latitude and longitude
https://api.open-meteo.com/v1/forecast?latitude=YOUR_LAT&longitude=YOUR_LONG
```

#### Market Price Fetching
- Displays real-time commodity prices
- Shows price changes and trends
- Covers: Rice, Wheat, Mustard, Lentil, Cotton
- Can be extended with API integration

#### Voice Input/Output Integration
- Browser-based speech recognition (works in Chrome, Edge, Safari)
- Supports English and Hindi voice input
- Voice output option (TTS) with on/off toggle
- Falls back to text input if voice unavailable

**To enable voice output:**
1. Go to Profile page
2. Enable "Voice Output" toggle
3. Save preferences

#### User Preferences Storage
- Saves to database with the following options:
  - **Language**: English, Hindi, Bhojpuri
  - **Mode**: Text Only or Text + Voice
  - **TTS Enabled**: Toggle for voice output
- Persists across sessions
- Accessible via `/web/profile/`

#### Chat History
- Automatically saves all questions and responses
- Accessible from `/web/history/`
- Displays timestamp for each conversation
- Can be filtered and searched

### 3. **Backend Integration**

#### API Endpoints Used
```
POST /query/ - Send message to AI
POST /web/api/save-preferences/ - Save user preferences
GET /web/api/get-preferences/ - Fetch user preferences
POST /web/api/save-chat/ - Save chat to history (if implemented)
```

#### Chat Flow
1. User sends message via chat interface
2. JavaScript fetches `/query/` endpoint
3. Backend processes with AI/RAG
4. Response displayed as chat bubble
5. Automatically saved to ChatHistory model
6. Audio played if TTS enabled

### 4. **Design System**

#### Color Palette
- **Primary**: `#2d7a38` (Green)
- **Accent**: `#7ba35a` (Earthy Green)
- **Background**: `#f5f2ea` (Off-white)
- **Text**: `#243424` (Dark Green)

#### Components
- **Buttons**: Rounded, with hover animations
- **Cards**: Subtle shadows, responsive grid
- **Chat Bubbles**: WhatsApp-style, user/assistant differentiation
- **Navigation**: Sticky header with mobile menu toggle

## File Structure

```
backend/frontend/
├── templates/frontend/
│   ├── base.html                 # Base template with navbar/footer
│   ├── landing.html              # Landing page
│   ├── chat.html                 # Chat interface
│   ├── dashboard.html            # Dashboard with weather/prices
│   ├── about.html                # About page
│   ├── profile.html              # User preferences
│   ├── history.html              # Chat history
│   ├── calendar.html             # Farm calendar
│   └── pest_guide.html           # Pest & disease guide
├── static/frontend/
│   ├── css/
│   │   └── styles.css            # All styles (responsive, animated)
│   ├── js/
│   │   └── app.js                # All JavaScript functionality
├── models.py                     # UserPreferences, ChatHistory models
├── views.py                      # View functions for all pages
├── urls.py                       # URL routing
└── admin.py                      # Admin panel configuration
```

## Setup & Installation

### 1. Create Migrations
```bash
cd backend
python3 manage.py makemigrations frontend
python3 manage.py migrate
```

### 2. Run the Server
```bash
python3 manage.py runserver
```

### 3. Create Admin User (if not done)
```bash
python3 manage.py createsuperuser
```

### 4. Access the Application
- **Frontend**: http://localhost:8000/web/
- **Admin Panel**: http://localhost:8000/admin/
- **API Admin**: http://localhost:8000/web/api/

## Customization Guide

### Adding a New Page

1. **Create template** in `templates/frontend/new_page.html`:
```html
{% extends 'frontend/base.html' %}
{% block title %}New Page - Kisan_Setu AI{% endblock %}
{% block page_name %}new-page{% endblock %}
{% block content %}
  <!-- Your content here -->
{% endblock %}
```

2. **Add view** in `views.py`:
```python
@login_required
def new_page(request):
    return render(request, 'frontend/new_page.html')
```

3. **Add URL** in `urls.py`:
```python
path('new-page/', views.new_page, name='new_page'),
```

4. **Add nav link** in `base.html`:
```html
<a href="{% url 'new_page' %}" class="nav-link">New Page</a>
```

### Changing Colors

Edit `:root` CSS variables in `static/frontend/css/styles.css`:
```css
:root {
    --primary: #2d7a38;           /* Change this */
    --primary-dark: #1e5627;
    --accent: #7ba35a;
    /* ... */
}
```

### Integrating Real APIs

#### For Weather (OpenWeatherMap with key):
```javascript
const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=25.59&lon=85.14&appid=YOUR_KEY&units=metric`
);
```

#### For Market Prices (APMC Data):
```javascript
const response = await fetch(
    'https://api-endpoint/market-prices?commodity=rice&region=bihar'
);
```

## Mobile Responsiveness

The frontend is fully responsive with breakpoints:
- **Desktop**: Full layout with all features
- **Tablet** (≤900px): Single column layout
- **Mobile** (≤480px): Stacked layout with hamburger menu

Test responsiveness:
```bash
Browser DevTools > Toggle Device Toolbar
```

## Performance Optimization

### Already Implemented
- CSS minification ready
- Image lazy loading support
- Scrollbar styling for speed
- Efficient animations with CSS transforms

### Recommendations
1. Compress images/icons
2. Implement Service Workers for offline support
3. Add loading states for API calls
4. Cache API responses client-side

## Browser Support

- **Chrome/Edge**: Full support (including speech recognition)
- **Safari**: Full support (including speech recognition)
- **Firefox**: Full support except voice input
- **Mobile browsers**: Responsive design, voice input in supported browsers

## Known Limitations

1. **Voice recognition**: Limited to browser's built-in APIs
2. **Weather data**: Currently static (easy to integrate real API)
3. **Market prices**: Placeholder data (integrate APMC or agricultural market APIs)
4. **Offline mode**: Not implemented (can add with Service Workers)

## Future Enhancements

1. Add crop yield calculator
2. Implement farmer ratings/reviews
3. Add multi-field support for multiple farms
4. Integrate IoT sensor data
5. Add video tutorials
6. Implement offline mode with sync
7. Add ML-based crop recommendation engine
8. Implement video call support for expert consultation

## Support & Debugging

### Common Issues

**Issue**: Voice input not working
- Solution: Use HTTPS in production, check browser permissions

**Issue**: Weather not loading
- Solution: Check network in browser console, verify API endpoint

**Issue**: Chat not saving to history
- Solution: Ensure ChatHistory model migrations ran correctly

### Debug Mode
Enable Django debug toolbar:
```python
# settings.py
DEBUG = True
INSTALLED_APPS += ['debug_toolbar']
MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
```

## Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Open-Meteo API](https://open-meteo.com/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [CSS Grid & Flexbox](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout)

## License & Credits

Kisan_Setu AI Frontend © 2026. Built for farmers in Bihar by a dedicated team of developers, designers, and agricultural experts.
