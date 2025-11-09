from rest_framework import permissions

class RolePermission(permissions.BasePermission):
    """
    Checks if the authenticated user has one of the allowed roles.
    Subclasses must define `allowed_roles` as a list or tuple.
    """

    allowed_roles: list[str] | tuple[str] = []

    def has_permission(self, request, view):
        user_role = getattr(request.user, "role", "").lower() if request.user.is_authenticated else None
        return bool(user_role in [role.lower() for role in self.allowed_roles])


# Single-role permissions
class IsAdmin(RolePermission):
    allowed_roles = ["admin"]

class IsTechnician(RolePermission):
    allowed_roles = ["technician"]

class IsStaff(RolePermission):
    allowed_roles = ["staff"]


# Multi-role permissions
class IsAdminOrTechnician(RolePermission):
    allowed_roles = ["admin", "technician"]

class IsAdminOrStaff(RolePermission):
    allowed_roles = ["admin", "staff"]
