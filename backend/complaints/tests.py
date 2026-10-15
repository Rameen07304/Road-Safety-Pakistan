"""Dashboard counts and admin moderation. Run with:  python manage.py test complaints"""
from unittest import mock

from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import User

from .models import Complaint


class DashboardAndModerationTests(TestCase):
    def setUp(self):
        cache.clear()
        self.citizen = User.objects.create_user(
            email="c@test.pk", password="x", full_name="C", phone="03001110001",
            id_type="passport", passport_number="CT0000001",
        )
        self.admin = User.objects.create_superuser(
            email="a@test.pk", password="x", full_name="A", phone="03001110002",
            id_type="passport", passport_number="AD0000001",
        )
        for status in ["submitted", "verified", "in_progress", "resolved", "rejected"]:
            Complaint.objects.create(
                citizen=self.citizen, image_url="https://example.com/x.jpg", description=status,
                latitude=31.5, longitude=74.3, status=status, urgency_level="low",
            )
        self.client = APIClient()

    def test_citizen_and_admin_counts_agree(self):
        self.client.force_authenticate(self.citizen)
        mine = self.client.get("/api/complaints/my-dashboard/").data["stats"]
        self.client.force_authenticate(self.admin)
        everyone = self.client.get("/api/admin/complaints/stats/").data
        expected = {"total": 5, "pending": 2, "in_progress": 1, "resolved": 1, "rejected": 1}
        for key, value in expected.items():
            self.assertEqual(mine[key], value, key)
            self.assertEqual(everyone[key], value, key)

    def test_status_filter_accepts_several_stages(self):
        self.client.force_authenticate(self.admin)
        res = self.client.get("/api/complaints/", {"status": "submitted,verified"})
        self.assertEqual(res.data["count"], 2)

    def test_admin_can_move_a_complaint_through_stages(self):
        self.client.force_authenticate(self.admin)
        cid = Complaint.objects.get(status="submitted").complaint_id
        for status in ["in_progress", "resolved"]:
            res = self.client.patch(f"/api/admin/complaints/{cid}/status/", {"status": status}, format="json")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.data["status"], status)

    def test_flagged_approve_and_reject(self):
        flagged = Complaint.objects.filter(status="submitted").first()
        Complaint.objects.filter(pk=flagged.pk).update(flagged=True)
        other = Complaint.objects.get(status="verified")
        Complaint.objects.filter(pk=other.pk).update(flagged=True)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post(f"/api/admin/complaints/{flagged.complaint_id}/approve/").status_code, 200)
        self.assertEqual(self.client.post(f"/api/admin/complaints/{other.complaint_id}/reject/").status_code, 200)
        self.assertEqual(Complaint.objects.filter(flagged=True).count(), 0)
        other.refresh_from_db()
        self.assertEqual(other.status, "rejected")

    def test_block_signs_the_person_out_and_unblock_restores(self):
        self.citizen.set_password("Str0ng-Passw0rd!")
        self.citizen.save()
        person = APIClient()
        login = person.post("/api/auth/login/", {"email": "c@test.pk", "password": "Str0ng-Passw0rd!"}, format="json")
        access = login.data["tokens"]["access"]

        self.client.force_authenticate(self.admin)
        url = f"/api/admin/users/{self.citizen.pk}/block/"
        self.assertEqual(self.client.post(url, {}, format="json").status_code, 400)  # reason required
        self.assertEqual(self.client.post(url, {"reason": "Fake reports"}, format="json").status_code, 200)

        # Every way back in is closed: the open session, the refresh cookie, a new login.
        person.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(person.get("/api/auth/profile/").status_code, 401)
        person.credentials()
        self.assertEqual(person.post("/api/auth/token/refresh/").status_code, 401)
        again = person.post("/api/auth/login/", {"email": "c@test.pk", "password": "Str0ng-Passw0rd!"}, format="json")
        self.assertEqual((again.status_code, again.data.get("code")), (403, "account_blocked"))
        # A wrong password still gets the generic answer, so blocking reveals nothing.
        wrong = person.post("/api/auth/login/", {"email": "c@test.pk", "password": "nope"}, format="json")
        self.assertEqual(wrong.status_code, 401)

        detail = self.client.get(f"/api/complaints/{Complaint.objects.first().complaint_id}/").data
        self.assertEqual((detail["reporter"]["is_active"], detail["reporter"]["blocked_reason"]), (False, "Fake reports"))

        self.assertEqual(self.client.delete(url).status_code, 200)
        self.assertEqual(person.post("/api/auth/login/", {"email": "c@test.pk", "password": "Str0ng-Passw0rd!"}, format="json").status_code, 200)

    def test_admins_cannot_be_blocked(self):
        self.client.force_authenticate(self.admin)
        res = self.client.post(f"/api/admin/users/{self.admin.pk}/block/", {"reason": "x"}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_admin_can_delete_a_complaint(self):
        self.client.force_authenticate(self.admin)
        cid = Complaint.objects.first().complaint_id
        self.assertEqual(self.client.delete(f"/api/admin/complaints/{cid}/").status_code, 204)
        self.assertFalse(Complaint.objects.filter(complaint_id=cid).exists())
        # The stats and flagged routes still resolve (the delete route is last).
        self.assertEqual(self.client.get("/api/admin/complaints/stats/").status_code, 200)
        self.assertEqual(self.client.get("/api/admin/complaints/flagged/").status_code, 200)

    @override_settings(CLOUDINARY_CLOUD_NAME="demo")
    def test_delete_removes_photos_from_cloudinary(self):
        base = "https://res.cloudinary.com/demo/image/upload/v1712345678/complaints/"
        c = Complaint.objects.first()
        Complaint.objects.filter(pk=c.pk).update(
            image_url=base + "own.jpg",
            annotated_image_url=base + "annotated/own_ai.png",
            resolved_image_url=base + "shared.jpg",
        )
        # Another complaint still shows shared.jpg, so that file must stay.
        Complaint.objects.exclude(pk=c.pk).filter(status="verified").update(image_url=base + "shared.jpg")
        self.client.force_authenticate(self.admin)
        with mock.patch("complaints.views.cloudinary.uploader.destroy", side_effect=Exception("down")) as destroy, \
                self.captureOnCommitCallbacks(execute=True):
            res = self.client.delete(f"/api/admin/complaints/{c.complaint_id}/")
        self.assertEqual(res.status_code, 204)  # a Cloudinary outage does not block the delete
        removed = sorted(call.args[0] for call in destroy.call_args_list)
        self.assertEqual(removed, ["complaints/annotated/own_ai", "complaints/own"])

    def test_public_id_ignores_other_hosts(self):
        from .views import cloudinary_public_id
        with self.settings(CLOUDINARY_CLOUD_NAME="demo"):
            self.assertIsNone(cloudinary_public_id("https://example.com/v1/complaints/x.jpg"))
            self.assertIsNone(cloudinary_public_id("https://res.cloudinary.com/other/image/upload/v1/x.jpg"))
            self.assertEqual(cloudinary_public_id("https://res.cloudinary.com/demo/image/upload/c_fill,w_200/v12/complaints/a.b.jpg"), "complaints/a.b")

    def test_uploaded_photo_has_no_location_metadata(self):
        import io

        import numpy as np
        from django.core.files.uploadedfile import SimpleUploadedFile
        from PIL import Image

        # A sharp, bright photo carrying the phone's GPS position in EXIF.
        img = Image.fromarray(np.random.default_rng(1).integers(60, 255, (400, 600, 3), dtype=np.uint8))
        exif = Image.Exif()
        exif[0x8825] = {2: (31.0, 31.0, 0.0), 4: (74.0, 20.0, 0.0)}  # GPSInfo: lat, lng
        exif[0x0110] = "Test Phone"  # camera model
        raw = io.BytesIO()
        img.save(raw, format="JPEG", exif=exif)
        self.assertTrue(Image.open(io.BytesIO(raw.getvalue())).getexif())  # the original has it

        sent = {}

        def fake_upload(fileobj, **kwargs):
            sent["bytes"] = fileobj.read()
            return {"secure_url": "https://res.cloudinary.com/demo/image/upload/v1/complaints/x.jpg"}

        self.client.force_authenticate(self.citizen)
        with mock.patch("complaints.views.cloudinary.uploader.upload", side_effect=fake_upload), \
                mock.patch("complaints.views.analyze_image", return_value={"detected_classes": []}):
            res = self.client.post("/api/complaints/upload-image/", {"image": SimpleUploadedFile("p.jpg", raw.getvalue(), "image/jpeg")})
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(dict(Image.open(io.BytesIO(sent["bytes"])).getexif()), {})

    def test_public_map_shows_photos_and_hides_rejected(self):
        rows = APIClient().get("/api/complaints/map/").data["complaints"]
        self.assertNotIn("rejected", {r["status"] for r in rows})
        self.assertTrue(all(r["image_url"] for r in rows))

    def _submit(self, analysis):
        """Submit a complaint as the citizen with a fixed detection result."""
        # The setUp complaints are "just sent"; age them past the 5-per-hour
        # spam rule so only the detection rule is under test.
        from django.utils import timezone
        Complaint.objects.update(submitted_at=timezone.now() - timezone.timedelta(hours=2))
        self.client.force_authenticate(self.citizen)
        with self.settings(CLOUDINARY_CLOUD_NAME="demo"), \
                mock.patch("complaints.views.analyze_image", return_value=analysis), \
                mock.patch("complaints.views._perceptual_image_hash", return_value=None), \
                mock.patch("complaints.views._upload_annotated_image", return_value=None):
            res = self.client.post("/api/complaints/submit/", {
                "image_url": "https://res.cloudinary.com/demo/image/upload/v1/complaints/road.jpg",
                "description": "Big hole on the road", "latitude": 31.55, "longitude": 74.34,
            }, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        return res.data

    def test_nothing_recognised_is_held_back_until_an_admin_approves(self):
        data = self._submit({"detected_classes": [], "confidence_scores": {}})
        self.assertTrue(data["flagged"])
        self.assertIn("No road problem recognised", data["flag_reason"])
        cid = data["complaint_id"]

        public_map = lambda: {r["complaint_id"] for r in APIClient().get("/api/complaints/map/").data["complaints"]}
        self.assertNotIn(cid, public_map())
        self.client.force_authenticate(self.admin)
        flagged = self.client.get("/api/admin/complaints/flagged/").data["results"]
        self.assertIn(cid, {c["complaint_id"] for c in flagged})

        self.assertEqual(self.client.post(f"/api/admin/complaints/{cid}/approve/").status_code, 200)
        self.assertIn(cid, public_map())

    def test_detection_outage_is_also_held_back_with_its_own_reason(self):
        data = self._submit({"detected_classes": [], "error": "Model not loaded and external service unavailable"})
        self.assertTrue(data["flagged"])
        self.assertIn("check unavailable", data["flag_reason"])

    def test_recognised_hazard_goes_straight_to_the_map(self):
        data = self._submit({"detected_classes": ["pothole"], "confidence_scores": {"pothole": 0.9}})
        self.assertFalse(data["flagged"])

    def test_submit_reuses_the_detection_from_upload(self):
        from django.core.cache import cache as django_cache

        from .views import _analysis_cache_key
        url = "https://res.cloudinary.com/demo/image/upload/v1/complaints/road.jpg"
        django_cache.set(_analysis_cache_key(url), {"detected_classes": ["garbage"], "confidence_scores": {}})
        self.client.force_authenticate(self.citizen)
        with self.settings(CLOUDINARY_CLOUD_NAME="demo"), \
                mock.patch("complaints.views.analyze_image") as analyze, \
                mock.patch("complaints.views._perceptual_image_hash", return_value=None), \
                mock.patch("complaints.views._upload_annotated_image", return_value=None):
            res = self.client.post("/api/complaints/submit/", {
                "image_url": url, "description": "Rubbish", "latitude": 31.55, "longitude": 74.34,
            }, format="json")
        analyze.assert_not_called()
        self.assertEqual(res.data["detected_classes"], ["garbage"])

    def test_rejected_and_unreviewed_stay_out_of_everything_public(self):
        held = Complaint.objects.get(status="submitted")
        Complaint.objects.filter(pk=held.pk).update(flagged=True)
        rejected = Complaint.objects.get(status="rejected")
        public = APIClient()  # a visitor, not logged in

        map_ids = {r["complaint_id"] for r in public.get("/api/complaints/map/").data["complaints"]}
        list_ids = {r["complaint_id"] for r in public.get("/api/complaints/").data["results"]}
        for ids in (map_ids, list_ids):
            self.assertNotIn(rejected.complaint_id, ids)
            self.assertNotIn(held.complaint_id, ids)
        # The public numbers count exactly what the map shows.
        self.assertEqual(public.get("/api/analytics/summary/").data["total_complaints"], len(map_ids))

        # Admins: rejected is off their map too; flagged stays, to be judged.
        self.client.force_authenticate(self.admin)
        admin_map = {r["complaint_id"] for r in self.client.get("/api/complaints/map/").data["complaints"]}
        self.assertNotIn(rejected.complaint_id, admin_map)
        self.assertIn(held.complaint_id, admin_map)

    def test_new_number_after_a_delete_does_not_collide(self):
        ids = sorted(Complaint.objects.values_list("complaint_id", flat=True))
        Complaint.objects.get(complaint_id=ids[1]).delete()  # a gap in the middle
        fresh = Complaint.objects.create(
            citizen=self.citizen, image_url="https://example.com/y.jpg", description="after delete",
            latitude=31.5, longitude=74.3,
        )
        self.assertNotIn(fresh.complaint_id, ids)
        self.assertEqual(fresh.complaint_id, ids[-1][:-4] + f"{int(ids[-1][-4:]) + 1:04d}")

    def test_held_report_can_be_tracked_but_reveals_nothing(self):
        held = Complaint.objects.get(status="submitted")
        Complaint.objects.filter(pk=held.pk).update(flagged=True)
        data = APIClient().get("/api/complaints/track/", {"complaint_id": held.complaint_id}).data
        self.assertTrue(data["under_review"])
        self.assertEqual(set(data), {"complaint_id", "submitted_at", "status", "under_review"})
        # The person who sent it still sees everything.
        self.client.force_authenticate(self.citizen)
        own = self.client.get("/api/complaints/track/", {"complaint_id": held.complaint_id}).data
        self.assertIn("image_url", own)

    def test_reporter_details_are_admin_only(self):
        self.client.force_authenticate(self.citizen)
        cid = Complaint.objects.first().complaint_id
        self.assertIsNone(self.client.get(f"/api/complaints/{cid}/").data.get("reporter"))

    def test_citizen_cannot_moderate(self):
        self.client.force_authenticate(self.citizen)
        cid = Complaint.objects.first().complaint_id
        self.assertEqual(self.client.patch(f"/api/admin/complaints/{cid}/status/", {"status": "resolved"}, format="json").status_code, 403)
        self.assertEqual(self.client.get("/api/admin/complaints/stats/").status_code, 403)
        self.assertEqual(self.client.delete(f"/api/admin/complaints/{cid}/").status_code, 403)
        self.assertEqual(self.client.post(f"/api/admin/users/{self.citizen.pk}/block/", {"reason": "x"}, format="json").status_code, 403)
