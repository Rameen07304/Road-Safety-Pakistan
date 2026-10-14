"""Auth flow checks. Run with:  python manage.py test accounts"""
import re

from django.core import mail
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import User

PASSWORD = "Str0ng-Passw0rd!"


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class AuthFlowTests(TestCase):
    def setUp(self):
        cache.clear()  # throttle counters
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="flow@test.pk", password=PASSWORD, full_name="Flow Test",
            phone="03001234000", id_type="passport", passport_number="FT0000001",
        )

    def login(self, password=PASSWORD):
        return self.client.post("/api/auth/login/", {"email": "flow@test.pk", "password": password}, format="json")

    def test_login_sets_httponly_refresh_cookie_and_hides_refresh_token(self):
        res = self.login()
        self.assertEqual(res.status_code, 200)
        self.assertNotIn("refresh", res.data["tokens"])
        cookie = res.cookies["rsp_refresh"]
        self.assertTrue(cookie["httponly"])
        self.assertEqual(cookie["path"], "/api/auth/")

    def test_refresh_is_repeatable_and_logout_revokes(self):
        self.login()
        token = self.client.cookies["rsp_refresh"].value
        # Two refreshes in a row (a reload, a second tab) must both succeed.
        for _ in range(2):
            res = self.client.post("/api/auth/token/refresh/")
            self.assertEqual(res.status_code, 200)
            self.assertIn("access", res.data)

        self.assertEqual(self.client.post("/api/auth/logout/").status_code, 200)
        self.client.cookies["rsp_refresh"] = token  # replay the revoked token
        self.assertEqual(self.client.post("/api/auth/token/refresh/").status_code, 401)

    def test_password_reset_end_to_end(self):
        res = self.client.post("/api/auth/password-reset/", {"email": "flow@test.pk"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        uid, token = re.search(r"/reset-password/([^/]+)/(\S+)", mail.outbox[0].body).groups()

        weak = {"uid": uid, "token": token, "new_password": "1", "confirm_password": "1"}
        self.assertEqual(self.client.post("/api/auth/password-reset/confirm/", weak, format="json").status_code, 400)

        new = "An0ther-Strong-One!"
        ok = {"uid": uid, "token": token, "new_password": new, "confirm_password": new}
        self.assertEqual(self.client.post("/api/auth/password-reset/confirm/", ok, format="json").status_code, 200)
        # Single use: the same link no longer works.
        self.assertEqual(self.client.post("/api/auth/password-reset/confirm/", ok, format="json").status_code, 400)
        self.assertEqual(self.login(new).status_code, 200)

    def test_unknown_email_gets_same_reply_and_no_mail(self):
        res = self.client.post("/api/auth/password-reset/", {"email": "nobody@test.pk"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)
