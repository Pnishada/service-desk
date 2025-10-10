from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Ticket, TicketHistory

@receiver(pre_save, sender=Ticket)
def create_ticket_history(sender, instance, **kwargs):
    if instance.id:  # existing ticket
        previous = Ticket.objects.get(id=instance.id)
        if previous.status != instance.status:
            TicketHistory.objects.create(
                ticket=instance,
                old_status=previous.status,
                new_status=instance.status,
                changed_by=getattr(instance, "_changed_by", None),  # custom tracking
                note=f"Status changed from {previous.status} to {instance.status}"
            )
