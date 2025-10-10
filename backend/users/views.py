from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import User
from .serializers import UserSerializer
from .permissions import IsAdmin


class UserViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for User model with role-based access control.
    """
    queryset = User.objects.all().order_by("id")
    serializer_class = UserSerializer

    def get_permissions(self):
        """Set permissions per action."""
        if self.action in ["list", "create", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated(), IsAdmin()]
        if self.action == "technicians":
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def retrieve(self, request, *args, **kwargs):
        """Restrict user detail access based on role."""
        user = self.get_object()

        if request.user.role.lower() == "technician" and user.role.lower() != "staff":
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        if request.user.role.lower() == "staff" and user != request.user:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="technicians")
    def technicians(self, request):
        """Return all users with role 'technician'"""
        technicians = User.objects.filter(role__iexact="technician").order_by("id")
        serializer = self.get_serializer(technicians, many=True)
        return Response(serializer.data)
