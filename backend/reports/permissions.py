from rest_framework import permissions

# ======================================================
# Admin-only permission
# ======================================================
class IsAdmin(permissions.BasePermission):
    """
    Allows access only to users with role 'ADMIN'.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, "role", "").upper() == "ADMIN"


# ======================================================
# Technician-only permission
# ======================================================
class IsTechnician(permissions.BasePermission):
    """
    Allows access only to users with role 'TECHNICIAN'.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, "role", "").upper() == "TECHNICIAN"


# ======================================================
# Admin or Technician permission
# ======================================================
class IsAdminOrTechnician(permissions.BasePermission):
    """
    Allows access to users with role 'ADMIN' or 'TECHNICIAN'.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        role = getattr(request.user, "role", "").upper()
        return role in ["ADMIN", "TECHNICIAN"]
