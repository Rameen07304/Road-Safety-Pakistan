import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


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

    class Meta:
        ordering = ["-submitted_at"]

    def save(self, *args, **kwargs):
        if not self.complaint_id:
            current_year = timezone.now().year
            count = Complaint.objects.filter(submitted_at__year=current_year).count() + 1
            self.complaint_id = f"RSP-{current_year}-{count:04d}"

        if self.status == "resolved" and not self.resolved_at:
            self.resolved_at = timezone.now()

        super().save(*args, **kwargs)

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
