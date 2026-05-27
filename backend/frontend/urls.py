from django.urls import path
from . import views

urlpatterns = [
    path('', views.landing, name='landing'),
    path('chat/', views.chat, name='chat'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('about/', views.about, name='about'),
    path('profile/', views.profile, name='profile'),
    path('history/', views.history, name='history'),
    path('calendar/', views.calendar, name='calendar'),
    path('pest-guide/', views.pest_guide, name='pest_guide'),
    path('api/save-preferences/', views.save_preferences, name='save_preferences'),
    path('api/get-preferences/', views.get_user_prefs, name='get_preferences'),
]
