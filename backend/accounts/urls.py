from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    UserProfileView,
    ChangePasswordView,
    PasswordResetView,
    PasswordResetConfirmView,
    CookieTokenRefreshView,
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
    path('password-reset/confirm/',
         PasswordResetConfirmView.as_view(),
         name='password-reset-confirm'),
    path('token/refresh/', 
         CookieTokenRefreshView.as_view(), 
         name='token-refresh'),
]
