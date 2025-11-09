from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification
from .serializers import NotificationSerializer

channel_layer = get_channel_layer()

@receiver(post_save, sender=Notification)
def broadcast_notification(sender, instance, created, **kwargs):
    if not created:
        return
    # Build payload (keep small)
    try:
        payload = {
            "id": instance.id,
            "ticket": instance.ticket.id,
            "ticket_title": instance.ticket.title,
            "ticket_status": instance.ticket.status,
            "message": instance.message,
            "read": instance.read,
            "created_at": instance.created_at.isoformat(),
        }
        group_name = f"user_{instance.user.id}_notifications"
        async_to_sync(channel_layer.group_send)(
            group_name,
            {"type": "send_notification", "payload": payload},
        )
    except Exception as e:
        # Log error, don't crash
        import logging
        logging.exception("Failed to broadcast notification: %s", e)
