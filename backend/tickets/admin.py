from django.contrib import admin
from .models import Ticket, TicketHistory


# ----------------------------
# Ticket Admin
# ----------------------------
class TicketAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "status",
        "priority",
        "category",
        "branch",
        "created_by",
        "assigned_to",
        "created_at",
        "updated_at",
    )
    list_filter = ("status", "priority", "branch", "category")
    search_fields = ("title", "description")
    readonly_fields = ("created_at", "updated_at")


# ----------------------------
# TicketHistory Admin
# ----------------------------
class TicketHistoryAdmin(admin.ModelAdmin):
    list_display = ("ticket", "action", "performed_by", "timestamp")
    list_filter = ("performed_by", "timestamp")
    search_fields = ("ticket__title", "action")
    readonly_fields = ("ticket", "action", "performed_by", "timestamp")


# ----------------------------
# Notification Admin
# ----------------------------
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "ticket", "message", "read", "created_at")
    list_filter = ("read", "created_at")
    search_fields = ("message", "user__username")
    readonly_fields = ("ticket", "created_at")


# ----------------------------
# Register models
# ----------------------------
admin.site.register(Ticket, TicketAdmin)
admin.site.register(TicketHistory, TicketHistoryAdmin)

