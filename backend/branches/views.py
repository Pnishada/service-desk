from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Branch
from .serializers import BranchSerializer

# -----------------------------
# Branch ViewSet
# -----------------------------
class BranchViewSet(viewsets.ModelViewSet):
    """
    - Admin users: Full CRUD
    - Staff/Technicians: Read-only
    """
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsAuthenticated()]
        return [IsAdminUser()]


# -----------------------------
# Staff/Technician Branch Endpoint
# -----------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def staff_branches(request):
    """
    Simple list of branches for staff/technicians
    """
    branches = Branch.objects.all().values("id", "name", "location")
    return Response(list(branches))
