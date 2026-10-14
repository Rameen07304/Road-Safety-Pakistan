from django.conf import settings
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    # The Django admin path is deliberately not listed: ADMIN_URL only helps
    # if it is not published by the API itself.
    return JsonResponse({
        'status': 'ok',
        'message': 'Road Safety Pakistan API',
        'version': '1.0.0',
        'endpoints': {
            'auth'      : '/api/auth/',
            'complaints': '/api/complaints/',
            'analytics' : '/api/analytics/',
        }
    })

urlpatterns = [
    path('', health_check),
    path('api/', health_check),
    path(settings.ADMIN_URL, admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/complaints/', 
         include('complaints.urls')),
    path('api/analytics/', 
         include('analytics.urls')),
    path('api/admin/', 
         include('complaints.admin_urls')),
]
