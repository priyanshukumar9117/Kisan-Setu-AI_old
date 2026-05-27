import os
from django.http import HttpResponse
from django.conf import settings


class CorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.allowed_origins = settings.CORS_ALLOWED_ORIGINS

    def __call__(self, request):
        origin = request.headers.get('Origin', '')
        allowed = self._is_origin_allowed(origin)

        # Handle preflight OPTIONS requests
        if request.method == 'OPTIONS':
            response = HttpResponse()
            if allowed:
                response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
            response["Access-Control-Max-Age"] = "86400"
            response["Access-Control-Allow-Credentials"] = "true"
            return response

        response = self.get_response(request)
        if allowed:
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Credentials"] = "true"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        return response

    def _is_origin_allowed(self, origin):
        """Check if origin is in allowed list."""
        if not origin:
            return False
        # Allow exact matches or localhost for development
        if origin in self.allowed_origins:
            return True
        # Allow localhost variations in development
        if settings.DEBUG and 'localhost' in origin:
            return True
        return False
