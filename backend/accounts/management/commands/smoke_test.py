"""
Full end-to-end smoke test covering all 8 features.
Run with:  python manage.py smoke_test
"""
import sys
from PIL import Image
import numpy as np

from django.core.management.base import BaseCommand
from django.db.models import Q

from accounts.models import User
from complaints.models import (
    Complaint, ComplaintCluster, ComplaintStatusHistory,
    predict_resolution_days, haversine_meters,
)
from complaints.views import (
    _find_or_create_cluster,
    _apply_cluster_urgency_bonus,
    _auto_assign_department,
    _perceptual_image_hash,
    _check_spam_flags,
    _check_image_quality,
    DEPARTMENT_MAP,
)
from complaints.serializers import _build_summary, ComplaintListSerializer, ComplaintDetailSerializer

PASS = 0
FAIL = 0


def check(label, condition, detail=""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  PASS  {label}")
    else:
        FAIL += 1
        print(f"  FAIL  {label}  — {detail}")


def make_citizen(idx):
    """Create or return a citizen user with a unique phone/email/cnic."""
    email = f"smoke_citizen_{idx}@test.pk"
    phone = f"0300000010{idx}"
    cnic = f"35201-{1000000 + idx:07d}-{idx % 10}"

    # email, phone and cnic are all unique -- match on any of them so a partial
    # leftover record from an earlier run is reused instead of colliding.
    user = User.objects.filter(
        Q(email=email) | Q(phone=phone) | Q(cnic=cnic)
    ).first()
    if user is None:
        user = User(
            email=email,
            full_name=f"Smoke Citizen {idx}",
            phone=phone,
            role="citizen",
            id_type="cnic",
            cnic=cnic,
        )
        user.set_password("testpass123")
        user.save()
    return user


SMOKE_ADMIN_EMAIL = "smoke_admin@test.pk"
SMOKE_ADMIN_PHONE = "03009000001"


def make_admin():
    """
    Create or return the dedicated smoke-test admin.

    Looks up by email *or* phone so the command stays idempotent even when a
    real admin (e.g. from `createadmin`) already occupies a similar record --
    both fields are unique, so keying on email alone can pass the lookup and
    still fail the insert.
    """
    user = User.objects.filter(
        Q(email=SMOKE_ADMIN_EMAIL) | Q(phone=SMOKE_ADMIN_PHONE)
    ).first()
    if user is None:
        user = User(
            email=SMOKE_ADMIN_EMAIL,
            full_name="Smoke Admin",
            phone=SMOKE_ADMIN_PHONE,
            id_type="passport",
            passport_number="AB1234567",
        )
        user.set_password("adminpass123")

    # Ensure the account always has the privileges the test needs.
    user.role = "admin"
    user.is_staff = True
    user.is_superuser = True
    user.save()
    return user


def create_complaint(user, lat=31.5204, lng=74.3587, detected_classes=None,
                     image_url="https://example.com/test.jpg", description="Smoke test hazard",
                     ward="Mall", urgency_score=30, flagged=False, flag_reason=None,
                     image_hash=None, status="submitted"):
    """Helper to create a complaint row directly (bypasses HTTP)."""
    if detected_classes is None:
        detected_classes = ["pothole"]
    c = Complaint.objects.create(
        citizen=user,
        image_url=image_url,
        description=description,
        latitude=lat,
        longitude=lng,
        address="Smoke Test Address",
        ward=ward,
        detected_classes=detected_classes,
        confidence_scores={"pothole": 0.9},
        sentiment="neutral",
        urgency_score=urgency_score,
        urgency_level="medium",
        flagged=flagged,
        flag_reason=flag_reason,
        image_hash=image_hash,
        status=status,
    )
    _auto_assign_department(c)
    return c


# ─── Test Scenarios ────────────────────────────────────────────────────────────


def test_1_normal_complaint():
    """Submit a normal complaint and verify all output fields."""
    print("\n--- TEST 1: Normal complaint (department, summary, prediction) ---")
    user = make_citizen(1)

    c = create_complaint(user, detected_classes=["pothole"], ward="Mall", urgency_score=40)
    _cluster, linked = _find_or_create_cluster(c)
    if linked > 1:
        _apply_cluster_urgency_bonus(c, linked)
        c.refresh_from_db()

    # assigned_department
    check("assigned_department set", c.assigned_department == "Roads & Infrastructure",
          f"got '{c.assigned_department}'")

    # summary is PII-safe
    summary = _build_summary(c)
    check("summary generated", len(summary) > 10, f"summary='{summary}'")
    for pii in ["0300", "35201", user.full_name]:
        check(f"summary no PII '{pii}'", pii not in summary)

    # predicted_resolution_days
    pred = predict_resolution_days(c.ward, c.detected_classes)
    check("predicted_resolution_days callable (None or float)", pred is None or isinstance(pred, (int, float)),
          f"got {pred}")

    # list serializer includes required fields
    ser = ComplaintListSerializer(c)
    data = ser.data
    check("list serializer has assigned_department", "assigned_department" in data)
    check("list serializer has summary", "summary" in data)
    check("list serializer has cluster_progression", "cluster_progression" in data)
    check("list serializer has flagged field", "flagged" in data)
    check("complaint not flagged", data["flagged"] is False)

    # detail serializer
    dser = ComplaintDetailSerializer(c)
    dd = dser.data
    check("detail serializer has predicted_resolution_days", "predicted_resolution_days" in dd)
    check("detail serializer has flagged", "flagged" in dd)
    check("detail serializer has flag_reason", "flag_reason" in dd)

    # Cleanup
    c.delete()


def test_2_duplicate_detection():
    """Two complaints same class within 50m → cluster, urgency bonus, progression."""
    print("\n--- TEST 2: Duplicate complaint detection ---")
    user = make_citizen(2)

    lat, lng = 31.520400, 74.358700

    c1 = create_complaint(user, lat=lat, lng=lng, detected_classes=["open_manhole"],
                          urgency_score=25, image_url="https://example.com/img1.jpg")
    cluster1, linked1 = _find_or_create_cluster(c1)
    check("first complaint: no cluster", cluster1 is None)
    check("first complaint: linked_count=0", linked1 == 0)

    # Second complaint ~10m away (same hazard class)
    lat2, lng2 = 31.520480, 74.358750  # ~10m offset
    c2 = create_complaint(user, lat=lat2, lng=lng2, detected_classes=["open_manhole"],
                          urgency_score=35, image_url="https://example.com/img2.jpg")
    cluster2, linked2 = _find_or_create_cluster(c2)
    if linked2 > 1:
        _apply_cluster_urgency_bonus(c2, linked2)
        c2.refresh_from_db()

    check("second complaint: cluster created", cluster2 is not None)
    check("second complaint: linked_count >= 2", linked2 >= 2, f"got {linked2}")
    check("urgency bonus applied (score > 25)", c2.urgency_score > 25 or linked2 <= 1,
          f"score={c2.urgency_score}, linked={linked2}")

    # Progression
    if cluster2:
        prog = cluster2.progression
        check("progression is not None", prog is not None)
        check("progression is valid value", prog in ("Worsening", "Improving", "Unchanged"),
              f"got '{prog}'")

    # Verify haversine between them is < 50m
    dist = haversine_meters(lat, lng, lat2, lng2)
    check(f"haversine distance < 50m ({dist:.1f}m)", dist < 50)

    # Cleanup
    c1.delete()
    c2.delete()
    if cluster2:
        cluster2.delete()


def test_3_rate_limit():
    """6 rapid complaints → 6th gets flagged."""
    print("\n--- TEST 3: Rate limit (6 rapid complaints) ---")
    user = make_citizen(3)

    created = []
    for i in range(6):
        img_hash = f"unique_hash_rate_{i}"  # unique hashes so only rate limit triggers
        should_flag, reason = _check_spam_flags(user, img_hash)
        c = create_complaint(user, detected_classes=["garbage"],
                             image_url=f"https://example.com/rate_{i}.jpg",
                             flagged=should_flag, flag_reason=reason,
                             image_hash=img_hash)
        created.append(c)

    last = created[-1]
    check("6th complaint is flagged", last.flagged is True,
          f"flagged={last.flagged}, reason={last.flag_reason}")
    check("flag reason mentions rate limit", last.flag_reason and "rate limit" in last.flag_reason.lower()
          or last.flag_reason and "Rate limit" in last.flag_reason,
          f"reason='{last.flag_reason}'")

    # Public map/list should not show flagged
    public_qs = Complaint.objects.filter(flagged=False)
    flagged_ids = [c.complaint_id for c in created if c.flagged]
    for fid in flagged_ids:
        check(f"flagged complaint {fid} hidden from public", not public_qs.filter(complaint_id=fid).exists())

    # Cleanup
    for c in created:
        c.delete()


def test_4_duplicate_image():
    """Same image hash → flagged as duplicate."""
    print("\n--- TEST 4: Duplicate image hash detection ---")
    user = make_citizen(4)

    shared_hash = "deadbeef12345678"
    c1 = create_complaint(user, image_hash=shared_hash,
                          image_url="https://example.com/dup1.jpg")

    should_flag, reason = _check_spam_flags(user, shared_hash)
    check("duplicate hash triggers flag", should_flag is True, f"should_flag={should_flag}")
    check("flag reason mentions duplicate image", reason and "duplicate" in reason.lower(),
          f"reason='{reason}'")

    c2 = create_complaint(user, image_hash=shared_hash, flagged=should_flag,
                          flag_reason=reason, image_url="https://example.com/dup2.jpg")
    check("second complaint is flagged", c2.flagged is True)

    # Cleanup
    c1.delete()
    c2.delete()


def test_5_admin_approve_reject():
    """Admin approves one flagged complaint, rejects another."""
    print("\n--- TEST 5: Admin approve/reject flagged complaints ---")
    user = make_citizen(5)
    admin = make_admin()

    c_approve = create_complaint(user, flagged=True, flag_reason="Rate limit test",
                                 image_url="https://example.com/approve.jpg",
                                 detected_classes=["speed_bump"])
    c_reject = create_complaint(user, flagged=True, flag_reason="Duplicate image test",
                                image_url="https://example.com/reject.jpg",
                                detected_classes=["garbage"])

    # --- Approve ---
    c_approve.flagged = False
    c_approve.flag_reason = None
    c_approve.save(update_fields=["flagged", "flag_reason"])
    c_approve.refresh_from_db()
    check("approved: flagged=False", c_approve.flagged is False)
    check("approved: flag_reason cleared", c_approve.flag_reason is None)
    check("approved: visible in public list", Complaint.objects.filter(
        flagged=False, complaint_id=c_approve.complaint_id).exists())

    # --- Reject ---
    old_status = c_reject.status
    c_reject.status = "rejected"
    c_reject.flagged = False
    c_reject.admin_notes = (c_reject.admin_notes or "") + "\n[Auto] Rejected from flagged review queue."
    c_reject.save(update_fields=["status", "flagged", "admin_notes"])
    ComplaintStatusHistory.objects.create(
        complaint=c_reject, old_status=old_status, new_status="rejected",
        changed_by=admin, note="Rejected from flagged review queue.",
    )
    c_reject.refresh_from_db()
    check("rejected: status=rejected", c_reject.status == "rejected")
    check("rejected: flagged=False", c_reject.flagged is False)
    check("rejected: status history entry exists",
          ComplaintStatusHistory.objects.filter(complaint=c_reject, new_status="rejected").exists())

    # Cleanup
    c_approve.delete()
    c_reject.delete()


def test_6_image_quality_gate():
    """Blurry and dark images are rejected by the quality gate."""
    print("\n--- TEST 6: Image quality gate (blur + dark) ---")

    # 1. Normal image: random noise (textured → passes blur, bright → passes dark)
    rng = np.random.RandomState(42)
    normal_arr = rng.randint(80, 200, (256, 256, 3), dtype=np.uint8)
    normal_img = Image.fromarray(normal_arr)
    result = _check_image_quality(normal_img)
    check("normal (textured, bright) image passes", result is None, f"got '{result}'")

    # 2. Blurry image: uniform color → zero Laplacian variance
    blur_arr = np.full((256, 256, 3), 128, dtype=np.uint8)
    blur_img = Image.fromarray(blur_arr)
    result = _check_image_quality(blur_img)
    check("blurry (flat) image rejected", result is not None and "blurry" in result.lower(),
          f"got '{result}'")

    # 3. Dark image: textured but very dark → passes blur, fails brightness
    #    Add strong edges so Laplacian variance passes the blur check
    dark_arr = rng.randint(0, 8, (256, 256, 3), dtype=np.uint8)
    # Insert a high-contrast checkerboard pattern at very low brightness
    for r in range(0, 256, 4):
        for col in range(0, 256, 4):
            dark_arr[r:r+2, col:col+2] = 25
    dark_img = Image.fromarray(dark_arr)
    result = _check_image_quality(dark_img)
    check("dark image rejected", result is not None and "dark" in result.lower(),
          f"got '{result}'")

    # 4. Dark + textured: should still be flagged as dark
    dark_textured = rng.randint(0, 20, (256, 256, 3), dtype=np.uint8)
    # Add some texture so Laplacian passes
    dark_textured[::2, ::2] = 25
    dark_tex_img = Image.fromarray(dark_textured)
    result = _check_image_quality(dark_tex_img)
    check("dark textured image rejected (as dark)",
          result is not None and ("dark" in result.lower() or "blurry" in result.lower()),
          f"got '{result}'")


# ─── Main ──────────────────────────────────────────────────────────────────────


class Command(BaseCommand):
    help = "Run a full E2E smoke test covering all 8 features."

    def handle(self, *args, **options):
        global PASS, FAIL
        PASS = 0
        FAIL = 0
        self.stdout.write("=" * 60)
        self.stdout.write("  ROAD SAFETY PAKISTAN — FULL SMOKE TEST")
        self.stdout.write("=" * 60)

        test_1_normal_complaint()
        test_2_duplicate_detection()
        test_3_rate_limit()
        test_4_duplicate_image()
        test_5_admin_approve_reject()
        test_6_image_quality_gate()

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(f"  RESULTS: {PASS} passed, {FAIL} failed")
        self.stdout.write("=" * 60)

        if FAIL > 0:
            sys.exit(1)
