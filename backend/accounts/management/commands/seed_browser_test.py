"""Seed the DB with test complaints for browser testing."""
from django.core.management.base import BaseCommand
from accounts.models import User
from complaints.models import Complaint


class Command(BaseCommand):
    help = "Seed flagged + normal complaints for browser testing"

    def handle(self, *args, **options):
        citizen = self._get_or_create_citizen()

        # 3 normal complaints (visible on map)
        normals = [
            {"desc": "Large pothole on main road near school", "cls": ["pothole"],
             "lat": 31.5204, "lng": 74.3587, "ward": "Mall", "dept": "Roads & Infrastructure"},
            {"desc": "Open manhole cover on sidewalk", "cls": ["open_manhole"],
             "lat": 31.5498, "lng": 74.3436, "ward": "Gulshan Ravi", "dept": "Roads & Infrastructure"},
            {"desc": "Garbage pile blocking drainage", "cls": ["garbage"],
             "lat": 31.5601, "lng": 74.3129, "ward": "Johar Town", "dept": "Solid Waste Management"},
        ]
        for n in normals:
            if Complaint.objects.filter(description=n["desc"]).exists():
                continue
            Complaint.objects.create(
                citizen=citizen,
                image_url="https://res.cloudinary.com/demo/image/upload/sample.jpg",
                description=n["desc"],
                latitude=n["lat"], longitude=n["lng"],
                address="123 Test Street", ward=n["ward"],
                detected_classes=n["cls"],
                confidence_scores={n["cls"][0]: 0.92},
                sentiment="concerned", urgency_score=45, urgency_level="medium",
                assigned_department=n["dept"],
            )

        # 3 flagged complaints (hidden from public, visible in admin queue)
        flaggged_data = [
            {"desc": "Spam report with duplicate photo", "cls": ["pothole"],
             "lat": 31.5300, "lng": 74.3500, "ward": "Data Ganj Baksh",
             "reason": "Duplicate image: same photo was already submitted"},
            {"desc": "Rate-limited spam submission", "cls": ["garbage"],
             "lat": 31.5100, "lng": 74.3700, "ward": "Allama Iqbal",
             "reason": "Rate limit: more than 5 complaints in 1 hour(s)"},
            {"desc": "Another duplicate flagged report", "cls": ["broken_manhole"],
             "lat": 31.5400, "lng": 74.3300, "ward": "Ravi",
             "reason": "Duplicate image: same photo was already submitted"},
        ]
        for f in flaggged_data:
            if Complaint.objects.filter(description=f["desc"]).exists():
                continue
            Complaint.objects.create(
                citizen=citizen,
                image_url="https://res.cloudinary.com/demo/image/upload/sample.jpg",
                description=f["desc"],
                latitude=f["lat"], longitude=f["lng"],
                address="456 Flagged Street", ward=f["ward"],
                detected_classes=f["cls"],
                confidence_scores={f["cls"][0]: 0.88},
                sentiment="neutral", urgency_score=30, urgency_level="low",
                assigned_department="Roads & Infrastructure",
                flagged=True, flag_reason=f["reason"],
                image_hash="abc123def456",
            )

        total = Complaint.objects.count()
        flagged = Complaint.objects.filter(flagged=True).count()
        self.stdout.write(self.style.SUCCESS(
            f"Seeded {total} complaints ({flagged} flagged, {total - flagged} normal)"
        ))

    @staticmethod
    def _get_or_create_citizen():
        """Return the browser-test citizen, creating it when absent.

        The command used to assume this user already existed, which made a
        fresh checkout fail with User.DoesNotExist before seeding anything.
        """
        email = "browser@test.com"
        citizen = User.objects.filter(email=email).first()
        if citizen is None:
            citizen = User(
                email=email,
                full_name="Browser Test Citizen",
                phone="03009000002",
                role="citizen",
                id_type="cnic",
                cnic="35201-9000002-1",
            )
            citizen.set_password("testpass123")
            citizen.save()
        return citizen
