from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from branches.models import Branch


class User(AbstractUser):
    class Roles(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        TECHNICIAN = "TECHNICIAN", "Technician"
        STAFF = "STAFF", "Staff"

    
    full_name = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        help_text="Full name of the user"
    )

    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.STAFF,
        help_text="Role of the user in the system"
    )

    branch = models.ForeignKey(
        Branch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
        help_text="Branch where the user belongs"
    )

    groups = models.ManyToManyField(
        Group,
        related_name="custom_user_set",
        blank=True,
        help_text="The groups this user belongs to.",
        verbose_name="groups",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="custom_user_permissions_set",
        blank=True,
        help_text="Specific permissions for this user.",
        verbose_name="user permissions",
    )

    def __str__(self):
        return f"{self.username} ({self.role})"

    @property
    def is_admin(self):
        return self.role == self.Roles.ADMIN

    @property
    def is_technician(self):
        return self.role == self.Roles.TECHNICIAN

    @property
    def is_staff_member(self):  # avoid clashing with Django's is_staff
        return self.role == self.Roles.STAFF
