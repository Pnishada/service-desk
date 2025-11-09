# tickets/signals.py

from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings

from tickets.models import Ticket, TicketHistory
from notifications.models import Notification  

User = get_user_model()


# -----------------------------
# Helper: Create Notification & Email
# -----------------------------
def create_notification(ticket, recipient, message, send_email=False):
    """Helper to create a notification and optionally send an email."""
    if not recipient:
        return

    # In-app notification
    Notification.objects.create(user=recipient, ticket=ticket, message=message)

    # Optional email
    if send_email and recipient.email:
        send_mail(
            subject=f"Ticket Update: #{ticket.id}",
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient.email],
            fail_silently=True,
        )


# -----------------------------
# Pre-save: Track old values
# -----------------------------
@receiver(pre_save, sender=Ticket)
def track_ticket_changes(sender, instance, **kwargs):
    """
    Before saving, keep a copy of old status and assigned_to fields
    to detect changes in post_save.
    """
    if not instance.pk:  # new ticket
        instance._old_status = None
        instance._old_assigned = None
        return

    try:
        previous = Ticket.objects.get(pk=instance.pk)
        instance._old_status = previous.status
        instance._old_assigned = previous.assigned_to
    except Ticket.DoesNotExist:
        instance._old_status = None
        instance._old_assigned = None


# -----------------------------
# Post-save: Log history & notify
# -----------------------------
@receiver(post_save, sender=Ticket)
def log_ticket_history_and_notify(sender, instance, created, **kwargs):
    """
    After saving a ticket:
    - Log history of creation, status changes, assignment changes
    - Create notifications for creator, assigned technician, and admins
    """
    changed_by = getattr(instance, "_changed_by", instance.created_by)

    if created:
        # ---------------- History ----------------
        TicketHistory.objects.create(
            ticket=instance,
            action=f"Ticket '{instance.title}' created",
            performed_by=instance.created_by,
        )

        # ---------------- Notify creator ----------------
        create_notification(
            ticket=instance,
            recipient=instance.created_by,
            message=f"Your ticket #{instance.id} '{instance.title}' has been created.",
            send_email=True,
        )

        # ---------------- Notify admins ----------------
        admins = User.objects.filter(role__iexact="admin", is_active=True)
        for admin in admins:
            create_notification(
                ticket=instance,
                recipient=admin,
                message=f"New ticket #{instance.id} created by {instance.created_by.username}.",
                send_email=True,
            )

    else:
        # ---------------- Status change ----------------
        if hasattr(instance, "_old_status") and instance.status != instance._old_status:
            TicketHistory.objects.create(
                ticket=instance,
                action=f"Status changed from {instance._old_status} to {instance.status}",
                performed_by=changed_by,
            )
            create_notification(
                ticket=instance,
                recipient=instance.created_by,
                message=f"Status of ticket #{instance.id} changed to {instance.status}.",
                send_email=True,
            )

        # ---------------- Assignment change ----------------
        if hasattr(instance, "_old_assigned") and instance.assigned_to != instance._old_assigned:
            assigned_name = instance.assigned_to.username if instance.assigned_to else "Unassigned"
            TicketHistory.objects.create(
                ticket=instance,
                action=f"Assigned to {assigned_name}",
                performed_by=changed_by,
            )
            if instance.assigned_to:
                create_notification(
                    ticket=instance,
                    recipient=instance.assigned_to,
                    message=f"You have been assigned to ticket #{instance.id}: '{instance.title}'.",
                    send_email=True,
                )


# -----------------------------
# Extra post-save: Notify admins on ticket creation
# -----------------------------
@receiver(post_save, sender=Ticket)
def notify_admins_on_ticket(sender, instance, created, **kwargs):
    """
    Creates Notification objects for all active admins when a new ticket is created.
    This ensures the notifications app can broadcast via channels.
    """
    if created:
        admins = User.objects.filter(role__iexact="admin", is_active=True)
        for admin in admins:
            Notification.objects.create(
                user=admin,
                ticket=instance,
                message=f"New ticket created: {instance.title}"
            )
