from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TicketViewSet, NotificationViewSet

# Initialize DRF router
router = DefaultRouter()

# Ticket routes
router.register(r"tickets", TicketViewSet, basename="ticket")

# Notifications routes
router.register(r"notifications", NotificationViewSet, basename="notification")

# Include router URLs
urlpatterns = [
    path("", include(router.urls)),
]
