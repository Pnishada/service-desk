from django.urls import path
from .views import (
    CompletedJobsView,
    TicketSummaryView,
    TechnicianPerformanceView,
    MonthlyPerformanceView
)

urlpatterns = [
    # Ticket summary and performance endpoints
    path("summary/", TicketSummaryView.as_view(), name="ticket-summary"),
    path("technician-performance/", TechnicianPerformanceView.as_view(), name="technician-performance"),
    path("monthly-performance/", MonthlyPerformanceView.as_view(), name="monthly-performance"),

    # Completed jobs endpoint
    path("completed/", CompletedJobsView.as_view(), name="completed-jobs"),
]
