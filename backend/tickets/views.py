from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.core.mail import send_mail
from django.contrib.auth import get_user_model

from .models import Ticket, Division, Branch, TicketHistory
from .serializers import (
    TicketSerializer,
    TicketCreateSerializer,
    TicketStatusUpdateSerializer,
    AssignTechnicianSerializer,
    DivisionSerializer,
    BranchSerializer,
    TicketHistorySerializer,
)
from notifications.models import Notification
from notifications.serializers import NotificationSerializer

User = get_user_model()


# ======================================================
# Ticket ViewSet
# ======================================================
class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all().order_by("-created_at")
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_serializer_class(self):
        if self.action == "create":
            return TicketCreateSerializer
        elif self.action in [
            "mine", "list", "retrieve", "assigned_tickets", "history", "completed_tickets"
        ]:
            return TicketSerializer
        elif self.action == "update_status":
            return TicketStatusUpdateSerializer
        elif self.action == "assign_ticket":
            return AssignTechnicianSerializer
        return TicketSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Ticket.objects.none()

        role = getattr(user, "role", "").lower()
        if role == "staff":
            return Ticket.objects.filter(created_by=user).order_by("-created_at")
        elif role == "technician":
            return Ticket.objects.filter(assigned_to=user).order_by("-created_at")
        return Ticket.objects.all().order_by("-created_at")

    # ----------------------------
    # Create Ticket
    # ----------------------------
    def perform_create(self, serializer):
        user = self.request.user
        ticket = serializer.save(
            created_by=user,
            full_name=user.full_name,
            email=user.email,
            phone=user.phone
        )

        # Notification
        Notification.objects.create(
            user=user,
            ticket=ticket,
            message=f"New ticket '{ticket.title}' created successfully."
        )

    # ----------------------------
    # My Tickets
    # ----------------------------
    @action(detail=False, methods=["get"], url_path="mine")
    def mine(self, request):
        user = request.user
        role = getattr(user, "role", "").lower()

        if role == "staff":
            tickets = Ticket.objects.filter(created_by=user)
        elif role == "technician":
            tickets = Ticket.objects.filter(assigned_to=user)
        else:
            tickets = Ticket.objects.all()

        serializer = self.get_serializer(tickets.order_by("-created_at"), many=True)
        return Response(serializer.data)

    # ----------------------------
    # Assigned Tickets
    # ----------------------------
    @action(detail=False, methods=["get"], url_path="assigned")
    def assigned_tickets(self, request):
        user = request.user
        role = getattr(user, "role", "").lower()

        if role == "technician":
            tickets = Ticket.objects.filter(assigned_to=user).order_by("-created_at")
        elif role == "admin":
            tickets = Ticket.objects.all().order_by("-created_at")
        else:
            tickets = Ticket.objects.none()

        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)

    # ----------------------------
    # Assign Technician
    # ----------------------------
    @action(detail=True, methods=["post"], url_path="assign")
    def assign_ticket(self, request, pk=None):
        ticket = self.get_object()
        serializer = AssignTechnicianSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        technician_id = serializer.validated_data["technician_id"]
        technician = get_object_or_404(User, pk=technician_id, role__iexact="technician")

        ticket.assigned_to = technician
        ticket.status = Ticket.STATUS_ASSIGNED
        ticket.save()

        # Ticket history
        TicketHistory.objects.create(
            ticket=ticket,
            action=f"Ticket assigned to {technician.get_full_name() or technician.username}",
            performed_by=request.user
        )

        # Notification
        Notification.objects.create(
            user=technician,
            ticket=ticket,
            message=f"You have been assigned a new ticket: {ticket.title}"
        )

        # Optional email
        if technician.email:
            try:
                send_mail(
                    subject=f"Ticket Assigned: {ticket.title}",
                    message=f"You have been assigned a new ticket.\n\nTitle: {ticket.title}\nDescription: {ticket.description}",
                    from_email="noreply@naita.lk",
                    recipient_list=[technician.email],
                    fail_silently=True,
                )
            except Exception:
                pass

        return Response(
            {"message": f"Ticket assigned to {technician.get_full_name() or technician.username}"},
            status=status.HTTP_200_OK,
        )

    # ----------------------------
    # Divisions
    # ----------------------------
    @action(detail=False, methods=["get"], url_path="divisions", permission_classes=[permissions.AllowAny])
    def divisions(self, request):
        divisions = Division.objects.all()
        serializer = DivisionSerializer(divisions, many=True)
        return Response(serializer.data)

    # ----------------------------
    # Branches
    # ----------------------------
    @action(detail=False, methods=["get"], url_path="branches", permission_classes=[permissions.AllowAny])
    def branches(self, request):
        branches = Branch.objects.all()
        serializer = BranchSerializer(branches, many=True)
        return Response(serializer.data)

    # ----------------------------
    # Update Ticket Status
    # ----------------------------
    @action(detail=True, methods=["patch"], url_path="status")
    def update_status(self, request, pk=None):
        ticket = self.get_object()
        serializer = TicketStatusUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        old_status = ticket.status
        ticket.status = serializer.validated_data["status"]
        ticket.save()

        comment = serializer.validated_data.get("comment", "")
        TicketHistory.objects.create(
            ticket=ticket,
            action=f"Status changed: {old_status} → {ticket.status}",
            performed_by=request.user,
            comment=comment
        )

        Notification.objects.create(
            user=ticket.created_by,
            ticket=ticket,
            message=f"Ticket '{ticket.title}' status updated to {ticket.status}"
        )

        return Response({
            "message": f"Ticket status updated to {ticket.status}",
            "ticket": TicketSerializer(ticket).data
        })

    # ----------------------------
    # Ticket Stats
    # ----------------------------
    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        data = {
            "by_status": list(Ticket.objects.values("status").annotate(count=Count("id"))),
            "by_priority": list(Ticket.objects.values("priority").annotate(count=Count("id"))),
            "by_branch": list(Ticket.objects.values("branch__name").annotate(count=Count("id"))),
            "by_technician": list(Ticket.objects.values("assigned_to__username").annotate(count=Count("id"))),
        }
        return Response(data)

    # ----------------------------
    # Ticket History
    # ----------------------------
    @action(detail=True, methods=["get"], url_path="history")
    def history(self, request, pk=None):
        ticket = self.get_object()
        history = TicketHistory.objects.filter(ticket=ticket).order_by("-timestamp")
        serializer = TicketHistorySerializer(history, many=True)
        return Response(serializer.data)

    # ----------------------------
    # Completed Tickets
    # ----------------------------
    @action(detail=False, methods=["get"], url_path="completed")
    def completed_tickets(self, request):
        tickets = Ticket.objects.filter(status=Ticket.STATUS_COMPLETED).order_by("-completed_at")
        serializer = TicketSerializer(tickets, many=True)
        return Response(serializer.data)


# ======================================================
# Notification ViewSet
# ======================================================
class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by("-created_at")

    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.read = True
        notification.save()
        return Response({"message": "Notification marked as read"})
