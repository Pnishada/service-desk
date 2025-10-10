from django.db import models
from django.conf import settings
from tickets.models import Ticket

User = settings.AUTH_USER_MODEL

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="notifications")
    message = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notification for {self.user} - {self.ticket.title}"
