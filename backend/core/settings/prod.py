"""
Production settings for Road Safety Pakistan.

Usage:
    Set DJANGO_SETTINGS_MODULE=core.settings.prod before running.
    Ensure all required env vars are set (see .env.example).
"""

import os

from .base import *  # noqa: F401,F403

# ---------------------------------------------------------------------------
# Debug & Hosts — DEBUG MUST be False in production
# ---------------------------------------------------------------------------
DEBUG = False

allowed_hosts = os.environ.get("ALLOWED_HOSTS", "")
ALLOWED_HOSTS = [host.strip() for host in allowed_hosts.split(",") if host.strip()]

if not ALLOWED_HOSTS:
    from django.core.exceptions import ImproperlyConfigured

    raise ImproperlyConfigured(
        "ALLOWED_HOSTS must be set in production. "
        "Add it to your .env file (comma-separated)."
    )

# ---------------------------------------------------------------------------
# Database — SQLite for now.
# TODO: Migrate to PostgreSQL for production.
#   Replace the block below with:
#     DATABASES = {
#         "default": {
#             "ENGINE": "django.db.backends.postgresql",
#             "NAME": os.environ.get("DB_NAME"),
#             "USER": os.environ.get("DB_USER"),
#             "PASSWORD": os.environ.get("DB_PASSWORD"),
#             "HOST": os.environ.get("DB_HOST", "localhost"),
#             "PORT": os.environ.get("DB_PORT", "5432"),
#         }
#     }
# ---------------------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# ---------------------------------------------------------------------------
# Security — enforce HTTPS and protect cookies in production
# ---------------------------------------------------------------------------
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# ---------------------------------------------------------------------------
# Email — use SMTP in production (configure via env vars or a service)
# ---------------------------------------------------------------------------
EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend"
)
EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 587))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
