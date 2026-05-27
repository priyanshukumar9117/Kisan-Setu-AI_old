from django.db import models
from django.contrib.auth.models import User


class UserPreferences(models.Model):
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('hi', 'Hindi'),
        ('bh', 'Bhojpuri'),
    ]
    
    MODE_CHOICES = [
        ('text', 'Text Only'),
        ('voice', 'Text + Voice'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='agricultural_preferences')
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default='en')
    mode = models.CharField(max_length=10, choices=MODE_CHOICES, default='text')
    tts_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - Preferences"


class ChatHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_queries')
    query = models.TextField()
    response = models.TextField()
    language = models.CharField(max_length=2, default='en')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.created_at}"
