import os
from datetime import timedelta
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

# Resolve BASE_DIR first so we can locate the .env file.
# BASE_DIR = backend/ (three levels up from this settings file).
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from backend/.env (or project-root .env as fallback).
from dotenv import load_dotenv

_env_file = BASE_DIR / ".env"
if not _env_file.exists():
    # Fall back to the project-root .env (one level above backend/).
    _env_file = BASE_DIR.parent / ".env"
load_dotenv(dotenv_path=_env_file)

# ---------------------------------------------------------------------------
# Core Django settings — all sensitive values read from environment variables
# ---------------------------------------------------------------------------

_secret = os.environ.get("SECRET_KEY")
if not _secret:
    raise ImproperlyConfigured(
        "SECRET_KEY is not set. Add it to your .env file "
        "(see .env.example for the expected format)."
    )
SECRET_KEY = _secret

DEBUG = os.environ.get("DEBUG", "True").lower() in ("1", "true", "yes")

ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]

# ---------------------------------------------------------------------------
# Cloudinary (image storage) — configured from env vars
# ---------------------------------------------------------------------------
import cloudinary

cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "cloudinary",
    "django_filters",
    "accounts",
    "complaints",
    "detection",
    "analytics",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"
ASGI_APPLICATION = "core.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

AUTH_USER_MODEL = "accounts.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    # Per client IP; covers login, register and password reset.
    "DEFAULT_THROTTLE_RATES": {
        "auth": os.environ.get("AUTH_THROTTLE_RATE", "10/min"),
    },
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

JWT_ACCESS_TOKEN_LIFETIME_MINUTES = int(os.environ.get("JWT_ACCESS_TOKEN_LIFETIME_MINUTES", 60))
JWT_REFRESH_TOKEN_LIFETIME_DAYS = int(os.environ.get("JWT_REFRESH_TOKEN_LIFETIME_DAYS", 7))

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=JWT_ACCESS_TOKEN_LIFETIME_MINUTES),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=JWT_REFRESH_TOKEN_LIFETIME_DAYS),
    # No rotation: the refresh token lives in an httpOnly cookie that scripts
    # cannot read, and rotating it raced with page reloads and second tabs (a
    # reload during a refresh kept the revoked cookie and signed the user out).
    # Logout and password changes still revoke it via the blacklist.
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# Images go straight to Cloudinary via cloudinary.uploader; no Django storage
# backend is needed. The name is used to accept only this account's URLs.
CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME")

# A host dashboard may save an optional value as an empty string; "or" treats
# that as unset. A blank ADMIN_URL would mount the admin at the site root.
ADMIN_URL = (os.environ.get("ADMIN_URL") or "admin-rsp-secure/").strip("/") + "/"
ML_MODEL_PATH = os.environ.get("ML_MODEL_PATH", "ml_models/best.pt")

cors_origins = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5174",
)
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in cors_origins.split(",")
    if origin.strip()
]
# The refresh-token cookie is sent cross-origin (frontend and API on different ports).
CORS_ALLOW_CREDENTIALS = True

AUTH_REFRESH_COOKIE = "rsp_refresh"
AUTH_COOKIE_SECURE = os.environ.get("AUTH_COOKIE_SECURE", "False").lower() in ("1", "true", "yes")
# "Lax" works when the frontend and API share a site (e.g. localhost ports, or
# app.example.com + api.example.com). Use "None" (with Secure) for different sites.
AUTH_COOKIE_SAMESITE = os.environ.get("AUTH_COOKIE_SAMESITE", "Lax")

# Used to build password-reset links in emails.
FRONTEND_URL = (os.environ.get("FRONTEND_URL") or "http://localhost:5173").rstrip("/")
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL") or "Road Safety Pakistan <no-reply@roadsafety.pk>"
PASSWORD_RESET_TIMEOUT = 60 * 60 * 24  # 1 day

STATIC_URL = "/static/"
MEDIA_URL = "/media/"

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Karachi"
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
