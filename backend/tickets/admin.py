from django.contrib import admin
from .models import Ticket, TicketHistory, Division


# ----------------------------
# Division Admin
# ----------------------------
@admin.register(Division)
class DivisionAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)
    filter_horizontal = ("categories",)  # lets you select multiple categories easily


# ----------------------------
# Ticket Admin
# ----------------------------
@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "status",
        "priority",
        "category",
        "branch",
        "division",
        "created_by",
        "assigned_to",
        "created_at",
        "updated_at",
    )
    list_filter = ("status", "priority", "branch", "category", "division")
    search_fields = ("title", "description")
    readonly_fields = ("created_at", "updated_at")


# ----------------------------
# TicketHistory Admin
# ----------------------------
@admin.register(TicketHistory)
class TicketHistoryAdmin(admin.ModelAdmin):
    list_display = ("ticket", "action", "performed_by", "timestamp")
    list_filter = ("performed_by", "timestamp")
    search_fields = ("ticket__title", "action")
    readonly_fields = ("ticket", "action", "performed_by", "timestamp")
