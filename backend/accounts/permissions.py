from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Allow access only to users whose role is admin."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")


class IsCitizenUser(BasePermission):
    """Allow access only to users whose role is citizen."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "citizen")
