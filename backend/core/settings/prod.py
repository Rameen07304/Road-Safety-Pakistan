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
# Database: DATABASE_URL (e.g. a free Neon/Supabase Postgres). Free hosts wipe
# the disk on every deploy, so SQLite is only the fallback for local prod runs.
# ---------------------------------------------------------------------------
import dj_database_url

DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}", conn_max_age=600
    )
}

# ---------------------------------------------------------------------------
# Static files (Django admin) served by WhiteNoise; no separate file server.
# ---------------------------------------------------------------------------
STATIC_ROOT = BASE_DIR / "staticfiles"
MIDDLEWARE.insert(
    MIDDLEWARE.index("django.middleware.security.SecurityMiddleware") + 1,
    "whitenoise.middleware.WhiteNoiseMiddleware",
)
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

# ---------------------------------------------------------------------------
# Behind proxies (Render, and Vercel's /api rewrite)
# ---------------------------------------------------------------------------
# The host terminates TLS; without this SECURE_SSL_REDIRECT loops forever.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
# The host's health probe calls /api/ over plain HTTP inside its network.
SECURE_REDIRECT_EXEMPT = [r"^api/$"]
# Throttles key on client IP. Behind proxies REMOTE_ADDR is the proxy, so every
# user would share one login bucket. NUM_PROXIES tells DRF how many
# X-Forwarded-For hops to trust (2 for Vercel -> Render).
if os.environ.get("NUM_PROXIES"):
    REST_FRAMEWORK["NUM_PROXIES"] = int(os.environ["NUM_PROXIES"])

# ---------------------------------------------------------------------------
# Security — enforce HTTPS and protect cookies in production
# ---------------------------------------------------------------------------
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

SESSION_COOKIE_SECURE = True
AUTH_COOKIE_SECURE = True
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
