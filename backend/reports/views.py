from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils.dateparse import parse_datetime
from django.http import HttpResponse
from django.db.models import Count, Avg, F, ExpressionWrapper, DurationField
from datetime import datetime
import csv
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

from tickets.models import Ticket
from users.models import User
from .serializers import TicketSerializer
from .permissions import IsAdmin, IsTechnician


# =========================
# Utility functions
# =========================
def parse_date_safe(date_str: str):
    if not date_str:
        return None
    dt = parse_datetime(date_str)
    if dt is None:
        try:
            dt = datetime.fromisoformat(date_str)
        except ValueError:
            dt = None
    return dt


def export_csv(data, filename, is_dict=True) -> HttpResponse:
    response = HttpResponse(content_type="text/csv")
    response['Content-Disposition'] = f'attachment; filename="{filename}_{datetime.now().strftime("%Y%m%d%H%M%S")}.csv"'
    writer = csv.writer(response)

    if is_dict:
        if data:
            writer.writerow(list(data[0].keys()))
            for row in data:
                writer.writerow([row.get(k, "") for k in row])
    else:
        for row in data:
            writer.writerow(row)
    return response


def export_pdf(data, filename, is_dict=True) -> HttpResponse:
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}_{datetime.now().strftime("%Y%m%d%H%M%S")}.pdf"'

    c = canvas.Canvas(response, pagesize=letter)
    width, height = letter
    x_offset, y_offset = 50, height - 50
    line_height = 20

    if is_dict:
        if data:
            headers = list(data[0].keys())
            for i, h in enumerate(headers):
                c.drawString(x_offset + i * 100, y_offset, h)
            y = y_offset - line_height
            for row in data:
                for i, h in enumerate(headers):
                    c.drawString(x_offset + i * 100, y, str(row.get(h, "")))
                y -= line_height
                if y < 50:
                    c.showPage()
                    y = height - 50
        else:
            c.drawString(x_offset, y_offset, "No data available")
    else:
        y = y_offset
        for row in data:
            c.drawString(x_offset, y, " | ".join(str(i) for i in row))
            y -= line_height
            if y < 50:
                c.showPage()
                y = height - 50

    c.save()
    return response


# =========================
# Completed Jobs API
# =========================
class CompletedJobsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsTechnician]

    def get(self, request):
        technician = request.GET.get("technician", "").strip()
        branch = request.GET.get("branch", "").strip()
        category = request.GET.get("category", "").strip()
        start_date_str = request.GET.get("startDate", "").strip()
        end_date_str = request.GET.get("endDate", "").strip()
        export_type = request.GET.get("export", "").lower()

        tickets = Ticket.objects.filter(status="COMPLETED").select_related("assigned_to", "branch", "category")

        if technician:
            tickets = tickets.filter(assigned_to__full_name__icontains=technician)
        if branch:
            tickets = tickets.filter(branch__name__icontains=branch)
        if category:
            tickets = tickets.filter(category__name__icontains=category)

        start_dt = parse_date_safe(start_date_str)
        end_dt = parse_date_safe(end_date_str)
        if start_dt:
            tickets = tickets.filter(completed_at__gte=start_dt)
        if end_dt:
            tickets = tickets.filter(completed_at__lte=end_dt)

        serializer = TicketSerializer(tickets, many=True)
        data = serializer.data

        if export_type == "csv":
            return export_csv(data, "completed_jobs")
        elif export_type == "pdf":
            return export_pdf(data, "completed_jobs")

        return Response(data, status=status.HTTP_200_OK)


# =========================
# Ticket Summary API
# =========================
class TicketSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        total_tickets = Ticket.objects.count()
        completed = Ticket.objects.filter(status="COMPLETED").count()
        pending = Ticket.objects.filter(status="OPEN").count()
        in_progress = Ticket.objects.filter(status="IN_PROGRESS").count()
        by_category = list(Ticket.objects.values("category__name").annotate(count=Count("id")))
        by_branch = list(Ticket.objects.values("branch__name").annotate(count=Count("id")))

        summary = {
            "total_tickets": total_tickets,
            "completed": completed,
            "pending": pending,
            "in_progress": in_progress,
            "by_category": by_category,
            "by_branch": by_branch
        }

        export_type = request.GET.get("export", "").lower()
        if export_type in ["csv", "pdf"]:
            rows = [["Metric", "Value"],
                    ["Total Tickets", total_tickets],
                    ["Completed", completed],
                    ["Pending", pending],
                    ["In Progress", in_progress]]
            if export_type == "csv":
                return export_csv(rows, "ticket_summary", is_dict=False)
            else:
                return export_pdf(rows, "ticket_summary", is_dict=False)

        return Response(summary, status=status.HTTP_200_OK)


# =========================
# Technician Performance API
# =========================
class TechnicianPerformanceView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        technicians = User.objects.filter(role__iexact="TECHNICIAN")
        performance = []

        for tech in technicians:
            tickets = Ticket.objects.filter(assigned_to=tech, status="COMPLETED")
            total_completed = tickets.count()
            avg_duration = tickets.annotate(
                duration=ExpressionWrapper(F('completed_at') - F('created_at'), output_field=DurationField())
            ).aggregate(avg_duration=Avg('duration'))['avg_duration']

            performance.append({
                "technician": tech.full_name,
                "total_completed": total_completed,
                "avg_completion_time": str(avg_duration) if avg_duration else None
            })

        export_type = request.GET.get("export", "").lower()
        if export_type == "csv":
            return export_csv(performance, "technician_performance")
        elif export_type == "pdf":
            return export_pdf(performance, "technician_performance")

        return Response(performance, status=status.HTTP_200_OK)


# =========================
# Monthly Performance API
# =========================
class MonthlyPerformanceView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        tickets = Ticket.objects.filter(status="COMPLETED")
        tickets_by_month = tickets.annotate(
            month=F('completed_at__month'),
            year=F('completed_at__year')
        ).values('year', 'month').annotate(total=Count('id')).order_by('year', 'month')

        data = list(tickets_by_month)

        export_type = request.GET.get("export", "").lower()
        if export_type == "csv":
            return export_csv(data, "monthly_performance")
        elif export_type == "pdf":
            return export_pdf(data, "monthly_performance")

        return Response(data, status=status.HTTP_200_OK)
