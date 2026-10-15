import math
import uuid

from django.conf import settings
from django.db import IntegrityError, models, transaction
from django.utils import timezone


def haversine_meters(lat1, lon1, lat2, lon2):
    """Return distance in meters between two (lat, lon) coordinate pairs."""
    R = 6_371_000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


MIN_RESOLUTION_SAMPLES = 3


def predict_resolution_days(ward, detected_classes):
    """
    Estimate resolution time in days by averaging resolved complaints
    grouped by ward + primary hazard type.  Falls back to city-wide
    average when < MIN_RESOLUTION_SAMPLES.  Returns None if even
    city-wide has too few samples.
    """
    primary_class = detected_classes[0] if isinstance(detected_classes, list) and detected_classes else None

    # --- Ward + hazard type average ---
    group_qs = Complaint.objects.filter(status="resolved", resolved_at__isnull=False)
    if ward:
        group_qs = group_qs.filter(ward__iexact=ward)

    group_samples = [
        c.resolution_time_days
        for c in group_qs
        if c.resolution_time_days is not None
        and (primary_class is None
             or (isinstance(c.detected_classes, list) and primary_class in c.detected_classes))
    ]
    if len(group_samples) >= MIN_RESOLUTION_SAMPLES:
        return round(sum(group_samples) / len(group_samples), 1)

    # --- City-wide fallback (all hazard types) ---
    city_samples = [
        c.resolution_time_days
        for c in Complaint.objects.filter(status="resolved", resolved_at__isnull=False)
        if c.resolution_time_days is not None
    ]
    if len(city_samples) >= MIN_RESOLUTION_SAMPLES:
        return round(sum(city_samples) / len(city_samples), 1)

    return None


class ComplaintCluster(models.Model):
    """Groups complaints that report the same hazard at the same location."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    primary_class = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Cluster {self.id} ({self.primary_class}) \u2013 {self.complaints.count()} reports"

    @property
    def progression(self):
        """
        Compare urgency_score of earliest vs most recent complaint in the cluster.
        Returns 'Worsening', 'Improving', 'Unchanged', or None (< 2 complaints).
        """
        members = self.complaints.order_by("submitted_at")
        if members.count() < 2:
            return None
        earliest = members.first().urgency_score
        latest = members.last().urgency_score
        if latest > earliest:
            return "Worsening"
        if latest < earliest:
            return "Improving"
        return "Unchanged"


class Complaint(models.Model):
    STATUS_CHOICES = [
        ("submitted", "Submitted"),
        ("verified", "Verified"),
        ("in_progress", "In Progress"),
        ("resolved", "Resolved"),
        ("rejected", "Rejected"),
    ]
    SENTIMENT_CHOICES = [
        ("neutral", "Neutral"),
        ("concerned", "Concerned"),
        ("frustrated", "Frustrated"),
        ("emergency", "Emergency"),
    ]
    URGENCY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complaint_id = models.CharField(max_length=20, unique=True, editable=False)
    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="complaints",
    )
    image_url = models.TextField()
    description = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    address = models.CharField(max_length=255, blank=True)
    ward = models.CharField(max_length=100, blank=True)
    landmark = models.CharField(max_length=255, blank=True, null=True)

    detected_classes = models.JSONField(default=list)
    confidence_scores = models.JSONField(default=dict)
    annotated_image_url = models.TextField(blank=True, null=True)
    resolved_image_url = models.TextField(blank=True, null=True)
    detection_raw = models.JSONField(default=dict)

    sentiment = models.CharField(max_length=20, choices=SENTIMENT_CHOICES, default="neutral")
    sentiment_keywords = models.JSONField(default=list)

    urgency_score = models.IntegerField(default=0)
    urgency_level = models.CharField(max_length=20, choices=URGENCY_CHOICES, default="low")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="submitted")
    assigned_department = models.CharField(max_length=100, blank=True, null=True)
    admin_notes = models.TextField(blank=True, null=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_complaints",
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    upvotes = models.IntegerField(default=0)

    cluster = models.ForeignKey(
        ComplaintCluster,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="complaints",
    )

    # Spam / fake report detection fields
    flagged = models.BooleanField(default=False)
    flag_reason = models.CharField(max_length=255, blank=True, null=True)
    image_hash = models.CharField(max_length=64, blank=True, null=True, db_index=True)

    class Meta:
        ordering = ["-submitted_at"]

    @staticmethod
    def next_complaint_id():
        """Highest number this year + 1. Counting rows instead (the old way)
        handed out a number still in use once any complaint had been deleted,
        and the report then failed on the unique constraint."""
        prefix = f"RSP-{timezone.now().year}-"
        # ponytail: reads this year's ids to find the max; a counter table if
        # yearly volume ever reaches hundreds of thousands.
        taken = Complaint.objects.filter(complaint_id__startswith=prefix).values_list("complaint_id", flat=True)
        highest = max((int(c[len(prefix):]) for c in taken if c[len(prefix):].isdigit()), default=0)
        return f"{prefix}{highest + 1:04d}"

    def save(self, *args, **kwargs):
        if self.status == "resolved" and not self.resolved_at:
            self.resolved_at = timezone.now()

        if self.complaint_id:
            return super().save(*args, **kwargs)

        # Two reports sent at the same moment can pick the same number; the
        # loser takes the next one instead of failing.
        for attempt in range(5):
            self.complaint_id = self.next_complaint_id()
            try:
                with transaction.atomic():
                    return super().save(*args, **kwargs)
            except IntegrityError:
                if attempt == 4:
                    raise

    @property
    def resolution_time_days(self):
        if self.resolved_at and self.submitted_at:
            duration = self.resolved_at - self.submitted_at
            return round(duration.total_seconds() / 86400, 2)
        return None

    def __str__(self):
        first_class = self.detected_classes[0] if isinstance(self.detected_classes, list) and self.detected_classes else "unknown"
        return f"{self.complaint_id} - {first_class}"


class ComplaintStatusHistory(models.Model):
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name="status_history",
    )
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )
    note = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["changed_at"]


class ComplaintUpvote(models.Model):
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name="upvote_records",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="complaint_upvotes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["complaint", "user"], name="unique_complaint_upvote_per_user"),
        ]

    def __str__(self):
        return f"{self.user_id} upvoted {self.complaint.complaint_id}"


def public_complaints():
    """Complaints the public sees: on the map and in every public count.

    Turned down ("Not accepted") reports are not hazards, and flagged ones are
    waiting for an admin, so both stay out. Deleted ones no longer exist.
    """
    return Complaint.objects.filter(flagged=False).exclude(status="rejected")
