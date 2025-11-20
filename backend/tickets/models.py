from django.db import models
from django.conf import settings
from django.utils import timezone
from branches.models import Branch
from categories.models import Category
import os
from django.utils.crypto import get_random_string

User = settings.AUTH_USER_MODEL


# ----------------------------
# Division model
# ----------------------------
class Division(models.Model):
    name = models.CharField(max_length=100, unique=True)
    categories = models.ManyToManyField(Category, blank=True)

    def __str__(self):
        return self.name


# ----------------------------
# Function to handle file upload path with short names
# ----------------------------
def ticket_file_path(instance, filename):
    ext = filename.split('.')[-1]
    # Generate short unique filename
    filename = f"{get_random_string(8)}.{ext}"
    return os.path.join("ticket_files", filename)


# ----------------------------
# Ticket model
# ----------------------------
class Ticket(models.Model):
    STATUS_OPEN = "OPEN"
    STATUS_ASSIGNED = "ASSIGNED"
    STATUS_IN_PROGRESS = "IN_PROGRESS"
    STATUS_COMPLETED = "COMPLETED"
    STATUS_CLOSED = "CLOSED"

    STATUS_CHOICES = [
        (STATUS_OPEN, "Open"),
        (STATUS_ASSIGNED, "Assigned"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_CLOSED, "Closed"),
    ]

    PRIORITY_LOW = "LOW"
    PRIORITY_MEDIUM = "MEDIUM"
    PRIORITY_HIGH = "HIGH"

    PRIORITY_CHOICES = [
        (PRIORITY_LOW, "Low"),
        (PRIORITY_MEDIUM, "Medium"),
        (PRIORITY_HIGH, "High"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default=PRIORITY_LOW)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPEN)

    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True)
    division = models.ForeignKey(Division, on_delete=models.SET_NULL, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)

    full_name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    file = models.FileField(upload_to=ticket_file_path, blank=True, null=True, max_length=500)
    due_date = models.DateTimeField(null=True, blank=True)

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="tickets_created"
    )
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tickets_assigned"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # Automatically set completed_at when status is COMPLETED
        if self.status == self.STATUS_COMPLETED and not self.completed_at:
            self.completed_at = timezone.now()
        elif self.status != self.STATUS_COMPLETED:
            self.completed_at = None
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.status}"


# ----------------------------
# TicketHistory model
# ----------------------------
class TicketHistory(models.Model):
    ticket = models.ForeignKey(Ticket, related_name="history", on_delete=models.CASCADE)
    action = models.CharField(max_length=255)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    comment = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        user = self.performed_by.username if self.performed_by else "Unknown"
        return f"{self.ticket.title}: {self.action} by {user}"
