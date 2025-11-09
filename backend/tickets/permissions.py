from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    """Allows access only to admin users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, "role", "").lower() == "admin"

class IsAdminOrTechnician(BasePermission):
    """Allows access to admin and technician users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, "role", "").lower() in ["admin", "technician"]

class IsStaff(BasePermission):
    """Allows access only to staff users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, "role", "").lower() == "staff"
