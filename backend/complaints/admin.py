from django.contrib import admin

from .models import Complaint, ComplaintStatusHistory, ComplaintUpvote


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = (
        "complaint_id",
        "urgency_level",
        "status",
        "ward",
        "submitted_at",
        "citizen",
    )
    list_filter = ("urgency_level", "status", "ward", "detected_classes")
    search_fields = ("complaint_id", "address", "ward")
    ordering = ("-urgency_score",)


@admin.register(ComplaintStatusHistory)
class ComplaintStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ("complaint", "old_status", "new_status", "changed_by", "changed_at")
    ordering = ("-changed_at",)


@admin.register(ComplaintUpvote)
class ComplaintUpvoteAdmin(admin.ModelAdmin):
    list_display = ("complaint", "user", "created_at")
    ordering = ("-created_at",)
