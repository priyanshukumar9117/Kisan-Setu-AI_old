from django.db import models
from django.contrib.auth.models import User


class UserSettings(models.Model):
    user_id = models.CharField(max_length=255, primary_key=True)
    auth_user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='settings', db_column='auth_user_id')
    language = models.CharField(max_length=10, default='en') # 'en', 'hi', or 'bho'
    mode = models.CharField(max_length=10, default='text') # 'text' or 'voice'
    tts_provider = models.CharField(max_length=10, default='edge') # 'edge', 'google', or 'local'

    def __str__(self):
        return f"User {self.user_id} - lang:{self.language} mode:{self.mode} tts:{self.tts_provider}"


class FarmProfile(models.Model):
    SOIL_TYPES = [
        ('alluvial', 'Alluvial (जलोढ़)'),
        ('clay', 'Clay (चिकनी मिट्टी)'),
        ('sandy', 'Sandy (बालू मिट्टी)'),
        ('loamy', 'Loamy (दोमट)'),
        ('red', 'Red (लाल मिट्टी)'),
        ('black', 'Black (काली मिट्टी)'),
    ]

    IRRIGATION_SOURCES = [
        ('canal', 'Canal (नहर)'),
        ('tubewell', 'Tube Well (बोरिंग)'),
        ('pond', 'Pond (तालाब)'),
        ('rainfed', 'Rainfed (वर्षा आधारित)'),
        ('river', 'River (नदी)'),
        ('well', 'Open Well (कुआं)'),
    ]

    user = models.OneToOneField(UserSettings, on_delete=models.CASCADE, related_name='farm_profile')
    farmer_name = models.CharField(max_length=200, blank=True)
    district = models.CharField(max_length=100, blank=True)
    village = models.CharField(max_length=200, blank=True)
    farm_size = models.FloatField(null=True, blank=True, help_text="Farm size in bigha")
    primary_crops = models.JSONField(default=list, blank=True)
    soil_type = models.CharField(max_length=50, blank=True, choices=SOIL_TYPES)
    irrigation_source = models.CharField(max_length=50, blank=True, choices=IRRIGATION_SOURCES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Farm: {self.user.user_id} - {self.district}"

    def to_context_string(self):
        """Generate a context string for LLM prompt injection."""
        parts = []
        if self.district:
            parts.append(f"District: {self.district}")
        if self.village:
            parts.append(f"Village: {self.village}")
        if self.farm_size:
            parts.append(f"Farm size: {self.farm_size} bigha")
        if self.primary_crops:
            parts.append(f"Crops: {', '.join(self.primary_crops)}")
        if self.soil_type:
            parts.append(f"Soil: {self.get_soil_type_display()}")
        if self.irrigation_source:
            parts.append(f"Irrigation: {self.get_irrigation_source_display()}")
        return "; ".join(parts) if parts else ""


class ChatMessage(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('ai', 'AI'),
    ]

    user = models.ForeignKey(UserSettings, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    audio_url = models.CharField(max_length=500, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"[{self.role}] {self.content[:60]}..."
