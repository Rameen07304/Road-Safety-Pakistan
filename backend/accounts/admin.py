from django.contrib import admin

from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "email",
        "phone",
        "role",
        "id_type",
        "is_active",
        "date_joined",
    )
    list_filter = ("role", "id_type", "is_active")
    search_fields = ("full_name", "email", "phone", "cnic")
    ordering = ("-date_joined",)
