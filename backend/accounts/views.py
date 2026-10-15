import logging

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from .permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserProfileSerializer,
)
from .models import User

logger = logging.getLogger(__name__)

# The refresh token lives in an httpOnly cookie so page scripts (and anything
# injected into them) cannot read it; only the short-lived access token is
# handed to the frontend, which keeps it in memory.
REFRESH_COOKIE_PATH = "/api/auth/"


def _set_refresh_cookie(response, refresh):
    response.set_cookie(
        settings.AUTH_REFRESH_COOKIE,
        str(refresh),
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        path=REFRESH_COOKIE_PATH,
    )


def _clear_refresh_cookie(response):
    response.delete_cookie(
        settings.AUTH_REFRESH_COOKIE,
        path=REFRESH_COOKIE_PATH,
        samesite=settings.AUTH_COOKIE_SAMESITE,
    )


def _session_response(user, data, status_code):
    refresh = RefreshToken.for_user(user)
    response = Response(
        {**data, "tokens": {"access": str(refresh.access_token)}},
        status=status_code,
    )
    _set_refresh_cookie(response, refresh)
    return response


def _end_all_sessions(user):
    """Revoke every refresh token issued to the user (after a password change)."""
    for token in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=token)


class BlockUserView(APIView):
    """Admin blocks (POST) or unblocks (DELETE) a citizen account.

    Blocking deactivates the account and revokes every session, so the person
    is signed out everywhere at once. Their complaints are kept for review.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def _target(self, request, user_id):
        user = get_object_or_404(User, pk=user_id)
        if user == request.user or user.role == "admin":
            return None, Response({"detail": "Admin accounts cannot be blocked here."}, status=status.HTTP_400_BAD_REQUEST)
        return user, None

    def post(self, request, user_id):
        user, error = self._target(request, user_id)
        if error:
            return error
        reason = str(request.data.get("reason", "")).strip()[:255]
        if not reason:
            return Response({"reason": ["Give a reason for blocking."]}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = False
        user.blocked_reason = reason
        user.blocked_at = timezone.now()
        user.save(update_fields=["is_active", "blocked_reason", "blocked_at"])
        _end_all_sessions(user)
        logger.info("User %s blocked by %s: %s", user.pk, request.user.pk, reason)
        return Response({"id": str(user.pk), "is_active": False, "blocked_reason": reason})

    def delete(self, request, user_id):
        user, error = self._target(request, user_id)
        if error:
            return error
        user.is_active = True
        user.blocked_reason = ""
        user.blocked_at = None
        user.save(update_fields=["is_active", "blocked_reason", "blocked_at"])
        logger.info("User %s unblocked by %s", user.pk, request.user.pk)
        return Response({"id": str(user.pk), "is_active": True})


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user = serializer.save()
            return _session_response(
                user,
                {"user": UserProfileSerializer(user).data},
                status.HTTP_201_CREATED,
            )


class LoginView(APIView):
    permission_classes = [AllowAny]
    # Without a limit, passwords could be guessed at full request speed.
    throttle_scope = "auth"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email_or_phone = serializer.validated_data.get("email")
        password = serializer.validated_data.get("password")
        user = User.objects.filter(email__iexact=email_or_phone).first()
        if not user:
            user = User.objects.filter(phone=email_or_phone).first()

        if not user or not user.check_password(password):
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_active:
            return Response(
                {"detail": "This account has been blocked.", "code": "account_blocked"},
                status=status.HTTP_403_FORBIDDEN,
            )

        return _session_response(
            user,
            {"user": UserProfileSerializer(user).data, "role": user.role},
            status.HTTP_200_OK,
        )


class CookieTokenRefreshView(APIView):
    """Issue a new access token from the refresh cookie (rotating the cookie)."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = TokenRefreshSerializer(
            data={"refresh": request.COOKIES.get(settings.AUTH_REFRESH_COOKIE, "")}
        )
        try:
            serializer.is_valid(raise_exception=True)
        except (TokenError, InvalidToken, DRFValidationError):
            response = Response({"detail": "Session expired."}, status=status.HTTP_401_UNAUTHORIZED)
            _clear_refresh_cookie(response)
            return response

        data = serializer.validated_data
        response = Response({"access": data["access"]}, status=status.HTTP_200_OK)
        if "refresh" in data:  # ROTATE_REFRESH_TOKENS
            _set_refresh_cookie(response, data["refresh"])
        return response


class LogoutView(APIView):
    # AllowAny: logging out must work even when the access token has expired.
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.AUTH_REFRESH_COOKIE)
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass  # already expired or revoked: nothing left to revoke
        response = Response({"detail": "Logout successful."}, status=status.HTTP_200_OK)
        _clear_refresh_cookie(response)
        return response


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"user": request.user})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if not request.user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"old_password": "Old password is not correct."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()
        _end_all_sessions(request.user)
        return _session_response(
            request.user,
            {"detail": "Password changed successfully."},
            status.HTTP_200_OK,
        )


class PasswordResetView(APIView):
    """Email a one-time reset link. The reply is identical whether or not the
    account exists, so the endpoint cannot be used to discover emails."""

    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        email = (request.data.get("email") or "").strip()
        if not email:
            return Response(
                {"detail": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
            try:
                send_mail(
                    "Reset your Road Safety Pakistan password",
                    (
                        f"Hello {user.full_name},\n\n"
                        f"Open this link to choose a new password:\n{link}\n\n"
                        "The link works once and expires in "
                        f"{settings.PASSWORD_RESET_TIMEOUT // 3600} hours. "
                        "If you did not ask for this, you can ignore this email."
                    ),
                    None,  # DEFAULT_FROM_EMAIL
                    [user.email],
                )
            except Exception:
                # Same reply either way; the failure is for the operator.
                logger.exception("Password reset email failed")

        return Response(
            {"detail": "If an account exists, password reset instructions have been sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        invalid = Response(
            {"detail": "This reset link is invalid or has expired."},
            status=status.HTTP_400_BAD_REQUEST,
        )
        try:
            uid = force_str(urlsafe_base64_decode(request.data.get("uid", "")))
            user = User.objects.get(pk=uid, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return invalid
        if not default_token_generator.check_token(user, request.data.get("token", "")):
            return invalid

        password = request.data.get("new_password") or ""
        if password != request.data.get("confirm_password"):
            return Response(
                {"confirm_password": ["Passwords do not match."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            validate_password(password, user)
        except ValidationError as exc:
            return Response({"new_password": exc.messages}, status=status.HTTP_400_BAD_REQUEST)

        # Changing the hash also invalidates this token, so the link is single-use.
        user.set_password(password)
        user.save()
        _end_all_sessions(user)
        return Response({"detail": "Password has been reset."}, status=status.HTTP_200_OK)
