"""
Development settings for Road Safety Pakistan.

Usage:
    python manage.py runserver --settings=core.settings.dev
    (or set DJANGO_SETTINGS_MODULE=core.settings.dev)
"""

from .base import *  # noqa: F401,F403

# ---------------------------------------------------------------------------
# Debug & Hosts
# ---------------------------------------------------------------------------
DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

# ---------------------------------------------------------------------------
# Database — SQLite for local development
# ---------------------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# ---------------------------------------------------------------------------
# Email — print to console instead of sending real emails
# ---------------------------------------------------------------------------
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
