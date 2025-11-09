from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    ticket_title = serializers.CharField(source="ticket.title", read_only=True)
    ticket_status = serializers.CharField(source="ticket.status", read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "ticket", "ticket_title", "ticket_status", "message", "read", "created_at"]
