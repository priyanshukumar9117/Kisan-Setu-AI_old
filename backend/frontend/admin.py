from django.contrib import admin
from .models import UserPreferences, ChatHistory


@admin.register(UserPreferences)
class UserPreferencesAdmin(admin.ModelAdmin):
    list_display = ('user', 'language', 'mode', 'tts_enabled', 'updated_at')
    search_fields = ('user__username', 'user__email')
    list_filter = ('language', 'mode', 'tts_enabled')


@admin.register(ChatHistory)
class ChatHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'query', 'language', 'created_at')
    search_fields = ('user__username', 'query')
    list_filter = ('language', 'created_at')
    readonly_fields = ('created_at',)
