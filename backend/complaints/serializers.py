from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from .models import Complaint, ComplaintStatusHistory, predict_resolution_days

User = get_user_model()

# Fields only the reporter and admins may see on a single complaint.
PRIVATE_DETAIL_FIELDS = ("citizen_name", "admin_notes", "flag_reason")


def can_view_private(request, complaint):
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return False
    return getattr(user, "role", None) == "admin" or complaint.citizen_id == user.id


def validate_cloudinary_url(value):
    """Accept only images hosted on this project's Cloudinary account.

    The server later downloads and opens this URL; a free-form string let any
    citizen point it at internal hosts (SSRF) or local files, whose bytes were
    then forwarded to the external detection service.
    """
    cloud = settings.CLOUDINARY_CLOUD_NAME
    if not cloud or not str(value).startswith(f"https://res.cloudinary.com/{cloud}/"):
        raise serializers.ValidationError("Image must be uploaded through this site.")
    return value


def _build_summary(obj):
    """
    Generate a one-line public summary from non-sensitive fields only.
    Never includes phone, CNIC, citizen name, or free-text description.
    """
    # Hazard type: first detected class, title-cased, fallback to "Hazard"
    detected = obj.detected_classes
    hazard = detected[0].replace("_", " ").title() if isinstance(detected, list) and detected else "Hazard"

    # Urgency level, title-cased
    urgency = (obj.urgency_level or "low").title()

    # Ward or generic location
    ward = obj.ward or "Unknown area"

    # Upvotes
    upvotes = obj.upvotes or 0
    upvote_text = f"{upvotes} upvote{'s' if upvotes != 1 else ''}"

    # Days since submission
    if obj.submitted_at:
        delta = timezone.now() - obj.submitted_at
        days_ago = max(delta.days, 0)
        time_text = f"reported {days_ago} day{'s' if days_ago != 1 else ''} ago"
    else:
        time_text = "recently reported"

    return f"{urgency}: {hazard} at {ward}, {upvote_text}, {time_text}"


class ComplaintSubmitSerializer(serializers.ModelSerializer):
    image_url = serializers.CharField(write_only=True, validators=[validate_cloudinary_url])

    class Meta:
        model = Complaint
        fields = [
            "image_url",
            "description",
            "latitude",
            "longitude",
            "address",
            "ward",
            "landmark",
        ]
        extra_kwargs = {
            "description": {"write_only": True},
            "latitude": {"write_only": True},
            "longitude": {"write_only": True},
            "address": {"write_only": True},
            "ward": {"write_only": True},
            "landmark": {"write_only": True, "required": False},
        }


class StatusHistorySerializer(serializers.ModelSerializer):
    changed_by = serializers.SerializerMethodField()
    status = serializers.CharField(source="new_status", read_only=True)
    timestamp = serializers.DateTimeField(source="changed_at", read_only=True)
    notes = serializers.CharField(source="note", read_only=True)

    class Meta:
        model = ComplaintStatusHistory
        fields = [
            "old_status",
            "new_status",
            "note",
            "changed_at",
            "changed_by",
            "status",
            "timestamp",
            "notes",
        ]

    def get_changed_by(self, obj):
        return obj.changed_by.full_name if obj.changed_by else None


class ComplaintListSerializer(serializers.ModelSerializer):
    has_upvoted = serializers.SerializerMethodField()
    linked_count = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()
    cluster_progression = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            "complaint_id",
            "detected_classes",
            "urgency_level",
            "urgency_score",
            "status",
            "latitude",
            "longitude",
            "address",
            "ward",
            "image_url",
            "annotated_image_url",
            "resolved_image_url",
            "submitted_at",
            "sentiment",
            "upvotes",
            "has_upvoted",
            "linked_count",
            "assigned_department",
            "summary",
            "cluster_progression",
            "flagged",
            "flag_reason",
        ]
        read_only_fields = fields

    def get_has_upvoted(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        return obj.upvote_records.filter(user=user).exists()

    def get_linked_count(self, obj):
        if obj.cluster:
            return obj.cluster.complaints.count()
        return 0

    def get_summary(self, obj):
        return _build_summary(obj)

    def get_cluster_progression(self, obj):
        if obj.cluster:
            return obj.cluster.progression
        return None


class ComplaintDetailSerializer(serializers.ModelSerializer):
    status_history = StatusHistorySerializer(many=True, read_only=True)
    citizen_name = serializers.SerializerMethodField()
    resolution_time_days = serializers.SerializerMethodField()
    annotated_image_base64 = serializers.SerializerMethodField()
    has_upvoted = serializers.SerializerMethodField()
    linked_count = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()
    cluster_progression = serializers.SerializerMethodField()
    predicted_resolution_days = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            "complaint_id",
            "citizen_name",
            "image_url",
            "description",
            "latitude",
            "longitude",
            "address",
            "ward",
            "landmark",
            "detected_classes",
            "confidence_scores",
            "annotated_image_url",
            "annotated_image_base64",
            "resolved_image_url",
            "detection_raw",
            "sentiment",
            "sentiment_keywords",
            "urgency_score",
            "urgency_level",
            "status",
            "assigned_department",
            "admin_notes",
            "verified_by",
            "resolved_at",
            "submitted_at",
            "updated_at",
            "resolution_time_days",
            "status_history",
            "upvotes",
            "has_upvoted",
            "linked_count",
            "summary",
            "cluster_progression",
            "predicted_resolution_days",
            "flagged",
            "flag_reason",
        ]
        read_only_fields = fields

    def get_citizen_name(self, obj):
        return obj.citizen.full_name if obj.citizen else None

    def to_representation(self, obj):
        data = super().to_representation(obj)
        if not can_view_private(self.context.get("request"), obj):
            for field in PRIVATE_DETAIL_FIELDS:
                data.pop(field, None)
            # Staff names stay internal; the status and note are what citizens need.
            for entry in data.get("status_history") or []:
                entry.pop("changed_by", None)
        return data

    def get_annotated_image_base64(self, obj):
        if not isinstance(obj.detection_raw, dict):
            return None
        return obj.detection_raw.get("annotated_image_base64")

    def get_resolution_time_days(self, obj):
        return obj.resolution_time_days

    def get_has_upvoted(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        return obj.upvote_records.filter(user=user).exists()

    def get_linked_count(self, obj):
        if obj.cluster:
            return obj.cluster.complaints.count()
        return 0

    def get_summary(self, obj):
        return _build_summary(obj)

    def get_cluster_progression(self, obj):
        if obj.cluster:
            return obj.cluster.progression
        return None

    def get_predicted_resolution_days(self, obj):
        return predict_resolution_days(obj.ward, obj.detected_classes)


class ComplaintStatusUpdateSerializer(serializers.ModelSerializer):
    resolved_image_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_resolved_image_url(self, value):
        return validate_cloudinary_url(value) if value else value

    class Meta:
        model = Complaint
        fields = ["status", "admin_notes", "assigned_department", "resolved_image_url"]

    def validate(self, data):
        status = data.get("status")
        if self.instance and self.instance.status == "resolved" and status != "resolved":
            raise serializers.ValidationError(
                {"status": "Cannot change status from resolved to a previous state."}
            )
        return data
