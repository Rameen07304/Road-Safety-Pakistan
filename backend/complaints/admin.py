from django.contrib import admin

from .models import Complaint, ComplaintCluster, ComplaintStatusHistory, ComplaintUpvote


@admin.register(ComplaintCluster)
class ComplaintClusterAdmin(admin.ModelAdmin):
    list_display = ("id", "primary_class", "complaint_count", "created_at")
    ordering = ("-created_at",)

    def complaint_count(self, obj):
        return obj.complaints.count()

    complaint_count.short_description = "Reports"


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = (
        "complaint_id",
        "urgency_level",
        "status",
        "ward",
        "submitted_at",
        "citizen",
        "cluster",
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
