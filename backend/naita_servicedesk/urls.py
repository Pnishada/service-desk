from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from users.views import UserViewSet
from users.auth_views import CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView
from branches.views import BranchViewSet
from tickets.views import TicketViewSet
from notifications.views import NotificationViewSet
from django.shortcuts import redirect
from staff import views as staff_views

# ==========================================================
# DRF Router Registration
# ==========================================================
router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")
router.register(r"branches", BranchViewSet, basename="branch")
router.register(r"tickets", TicketViewSet, basename="ticket")
router.register(r"notifications", NotificationViewSet, basename="notification")

# ==========================================================
# Root Redirect Function
# ==========================================================
def root_redirect(request):
    """Redirect users to their respective dashboards based on role."""
    if request.user.is_authenticated:
        role = getattr(request.user, "role", "").lower()
        if role == "admin":
            return redirect("/admin/dashboard")
        elif role == "technician":
            return redirect("/technician/dashboard")
        elif role == "staff":
            return redirect("/staff/dashboard")
    return redirect("/login")

# ==========================================================
# URL Patterns
# ==========================================================
urlpatterns = [
    # Django Admin
    path("admin/", admin.site.urls),

    # API Endpoints via DRF Router
    path("api/", include(router.urls)),

    # JWT Authentication
    path("api/auth/login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # App-Specific URLs (if you have extra custom views)
    path("api/categories/", include("categories.urls")),

    # Staff Dashboard (web)
    path("staff/dashboard/", staff_views.dashboard, name="staff_dashboard"),
    
    path("api/reports/", include("reports.urls")),

    # Root Redirect
    path("", root_redirect, name="root_redirect"),
]

# Serve media files in DEBUG mode
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
