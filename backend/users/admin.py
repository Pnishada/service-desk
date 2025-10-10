from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ("username", "email", "role", "branch", "is_staff", "is_active")
    list_filter = ("role", "branch", "is_staff", "is_active")
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Personal info", {"fields": ("full_name", "email")}),
        ("Roles & Branch", {"fields": ("role", "branch")}),
        ("Permissions", {"fields": ("is_staff", "is_active")}),
    )


admin.site.register(User, CustomUserAdmin)
