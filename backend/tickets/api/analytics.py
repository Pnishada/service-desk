from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, F, Q, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.http import HttpResponse
import csv
from ..models import Ticket, User

# ----------------------------
# Custom permission: Admin only
# ----------------------------
class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        role = getattr(request.user, "role", None)
        print(f"[DEBUG] User {request.user.username} role: {role}")  # Debug log
        return request.user.is_authenticated and role and role.lower() == "admin"

# ----------------------------
# Ticket Analytics API
# ----------------------------
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsAdmin])
def ticket_stats(request):
    """
    Returns a summary of tickets for admin dashboard:
    - Total tickets
    - Tickets grouped by status
    - Tickets grouped by priority
    - Tickets grouped by branch
    - Overdue tickets count
    - Tickets grouped by technician
    Supports optional query params:
    - start_date (YYYY-MM-DD)
    - end_date (YYYY-MM-DD)
    - export=csv
    """
    now = timezone.now()

    # ------------------------
    # Date Filtering
    # ------------------------
    start_date_str = request.query_params.get("start_date")
    end_date_str = request.query_params.get("end_date")
    date_filter = Q()
    if start_date_str:
        start_date = parse_date(start_date_str)
        if start_date:
            date_filter &= Q(created_at__date__gte=start_date)
    if end_date_str:
        end_date = parse_date(end_date_str)
        if end_date:
            date_filter &= Q(created_at__date__lte=end_date)

    tickets_qs = Ticket.objects.filter(date_filter) if date_filter else Ticket.objects.all()

    # ------------------------
    # Aggregations
    # ------------------------
    total_tickets = tickets_qs.count()

    by_status = tickets_qs.values("status").annotate(count=Count("id")).order_by("-count")
    by_priority = tickets_qs.values("priority").annotate(count=Count("id")).order_by("-count")
    
    by_branch = (
        tickets_qs
        .values(branch_name=Coalesce(F("branch__name"), Value("Unknown")))
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    by_technician = (
        tickets_qs.filter(assigned_to__isnull=False)
        .values(username=Coalesce(F("assigned_to__username"), Value("Unassigned")))
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    overdue = tickets_qs.filter(
        status__in=["OPEN", "ASSIGNED", "IN_PROGRESS"],
        due_date__lt=now
    ).count()

    # ------------------------
    # CSV Export
    # ------------------------
    if request.query_params.get("export") == "csv":
        response = HttpResponse(content_type="text/csv")
        response['Content-Disposition'] = 'attachment; filename="ticket_stats.csv"'

        writer = csv.writer(response)
        writer.writerow(["Category", "Name", "Count"])

        for item in by_status:
            writer.writerow(["Status", item["status"], item["count"]])
        for item in by_priority:
            writer.writerow(["Priority", item["priority"], item["count"]])
        for item in by_branch:
            writer.writerow(["Branch", item.get("branch_name", "Unknown"), item["count"]])
        for item in by_technician:
            writer.writerow(["Technician", item.get("username", "Unassigned"), item["count"]])
        writer.writerow(["Overdue Tickets", "", overdue])

        return response

    # ------------------------
    # JSON Response
    # ------------------------
    data = {
        "total_tickets": total_tickets,
        "by_status": list(by_status),
        "by_priority": list(by_priority),
        "by_branch": list(by_branch),
        "by_technician": list(by_technician),
        "overdue": overdue,
    }

    return Response(data)
