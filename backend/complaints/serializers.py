from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Complaint, ComplaintStatusHistory

User = get_user_model()


class ComplaintSubmitSerializer(serializers.ModelSerializer):
    image_url = serializers.CharField(write_only=True)

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
            "submitted_at",
            "sentiment",
        ]
        read_only_fields = fields


class ComplaintDetailSerializer(serializers.ModelSerializer):
    status_history = StatusHistorySerializer(many=True, read_only=True)
    citizen_name = serializers.SerializerMethodField()
    resolution_time_days = serializers.SerializerMethodField()
    annotated_image_base64 = serializers.SerializerMethodField()

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
        ]
        read_only_fields = fields

    def get_citizen_name(self, obj):
        return obj.citizen.full_name if obj.citizen else None

    def get_annotated_image_base64(self, obj):
        if not isinstance(obj.detection_raw, dict):
            return None
        return obj.detection_raw.get("annotated_image_base64")

    def get_resolution_time_days(self, obj):
        return obj.resolution_time_days


class ComplaintStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = ["status", "admin_notes", "assigned_department"]

    def validate(self, data):
        status = data.get("status")
        if self.instance and self.instance.status == "resolved" and status != "resolved":
            raise serializers.ValidationError(
                {"status": "Cannot change status from resolved to a previous state."}
            )
        return data
