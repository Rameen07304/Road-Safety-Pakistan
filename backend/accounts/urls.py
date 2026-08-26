from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    UserProfileView,
    ChangePasswordView,
    PasswordResetView,
)

app_name = 'accounts'

urlpatterns = [
    path('register/', RegisterView.as_view(), 
         name='register'),
    path('login/', LoginView.as_view(), 
         name='login'),
    path('logout/', LogoutView.as_view(), 
         name='logout'),
    path('profile/', UserProfileView.as_view(), 
         name='profile'),
    path('change-password/', 
         ChangePasswordView.as_view(), 
         name='change-password'),
    path('password-reset/',
         PasswordResetView.as_view(),
         name='password-reset'),
    path('token/refresh/', 
         TokenRefreshView.as_view(), 
         name='token-refresh'),
]
