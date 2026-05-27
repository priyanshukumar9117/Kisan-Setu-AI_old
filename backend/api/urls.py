from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('api/register/', views.register, name='register'),
    path('api/login/', views.login_view, name='login'),
    path('api/user-info/', views.user_info, name='user_info'),

    # Chat
    path('query/', views.query_bot, name='query_bot'),
    path('api/chat-history/', views.chat_history, name='chat_history'),
    path('api/clear-chat/', views.clear_chat_history, name='clear_chat_history'),

    # Settings
    path('set-language/', views.set_language, name='set_language'),
    path('set-mode/', views.set_mode, name='set_mode'),
    path('set-tts/', views.set_tts, name='set_tts'),

    # Farm Profile
    path('api/farm-profile/', views.farm_profile, name='farm_profile'),

    # Weather
    path('api/weather/', views.weather_advisory, name='weather_advisory'),

    # Mandi Prices
    path('api/mandi-prices/', views.mandi_prices, name='mandi_prices'),

    # Disease Detection
    path('api/detect-disease/', views.detect_disease, name='detect_disease'),

    # Meta
    path('api/districts/', views.get_districts, name='get_districts'),
]
