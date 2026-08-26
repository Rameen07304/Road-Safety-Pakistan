from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({
        'status': 'ok',
        'message': 'Road Safety Pakistan API',
        'version': '1.0.0',
        'endpoints': {
            'auth'      : '/api/auth/',
            'complaints': '/api/complaints/',
            'detect'    : '/api/detect/',
            'analytics' : '/api/analytics/',
            'admin_ui'  : '/admin-rsp-secure/',
        }
    })

urlpatterns = [
    path('', health_check),           # ← add this
    path('api/', health_check),       # ← and this
    path('admin-rsp-secure/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/complaints/', 
         include('complaints.urls')),
    path('api/detect/', 
         include('detection.urls')),
    path('api/analytics/', 
         include('analytics.urls')),
    path('api/admin/', 
         include('complaints.admin_urls')),
]
