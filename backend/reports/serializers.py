from rest_framework import serializers
from tickets.models import Ticket
from users.models import User

# ======================================================
# User Serializer (basic info)
# ======================================================
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "full_name", "email", "role"]


# ======================================================
# Ticket Serializer (for reporting)
# ======================================================
class TicketSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source="branch.name", default="N/A")
    category_name = serializers.CharField(source="category.name", default="N/A")

    class Meta:
        model = Ticket
        fields = [
            "id",
            "title",
            "description",
            "status",
            "priority",
            "created_at",
            "completed_at",
            "assigned_to",
            "assigned_to_name",
            "branch_name",
            "category_name",
        ]

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.full_name if obj.assigned_to else "Unassigned"
