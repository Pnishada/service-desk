from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Ticket, TicketHistory, Branch, Division, Category
from notifications.models import Notification

User = get_user_model()


# ======================================================
# User Serializer
# ======================================================
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "full_name", "email", "role"]


# ======================================================
# Ticket History Serializer
# ======================================================
class TicketHistorySerializer(serializers.ModelSerializer):
    performed_by = UserSerializer(read_only=True)

    class Meta:
        model = TicketHistory
        fields = [
            "id",
            "ticket",
            "action",
            "performed_by",
            "comment",
            "timestamp",
        ]
        read_only_fields = fields


# ======================================================
# Branch Serializer
# ======================================================
class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "name"]


# ======================================================
# Division Serializer
# ======================================================
class DivisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Division
        fields = ["id", "name"]


# ======================================================
# Category Serializer
# ======================================================
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


# ======================================================
# Ticket Serializer (Read)
# ======================================================
class TicketSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    history = TicketHistorySerializer(many=True, read_only=True)
    branch = BranchSerializer(read_only=True)
    division = DivisionSerializer(read_only=True)
    category = CategorySerializer(read_only=True)

    # New fields
    created_by_name = serializers.SerializerMethodField()
    creator_email = serializers.SerializerMethodField()
    creator_phone = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            "id",
            "title",
            "description",
            "category",
            "priority",
            "status",
            "division",
            "branch",
            "full_name",
            "email",
            "phone",
            "file",
            "created_by",
            "assigned_to",
            "created_at",
            "updated_at",
            "completed_at",
            "history",
            "created_by_name",
            "creator_email",
            "creator_phone",
        ]
        read_only_fields = [
            "created_by",
            "assigned_to",
            "created_at",
            "updated_at",
            "completed_at",
            "history",
        ]

    # Methods for new fields
    def get_created_by_name(self, obj):
        if obj.created_by and obj.created_by.full_name:
            return obj.created_by.full_name
        return obj.full_name or "N/A"

    def get_creator_email(self, obj):
        if obj.created_by and obj.created_by.email:
            return obj.created_by.email
        return obj.email or "N/A"

    def get_creator_phone(self, obj):
        if obj.created_by and getattr(obj.created_by, "phone", None):
            return obj.created_by.phone
        return obj.phone or "N/A"


# ======================================================
# Ticket Create Serializer
# ======================================================
class TicketCreateSerializer(serializers.ModelSerializer):
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all())
    division = serializers.PrimaryKeyRelatedField(queryset=Division.objects.all(), required=False, allow_null=True)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    file = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Ticket
        fields = [
            "title",
            "description",
            "priority",
            "branch",
            "division",
            "category",
            "full_name",
            "email",
            "phone",
            "file",
        ]


# ======================================================
# Ticket Status Update Serializer
# ======================================================
class TicketStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Ticket.STATUS_CHOICES)
    comment = serializers.CharField(required=False, allow_blank=True, max_length=500)


# ======================================================
# Assign Technician Serializer
# ======================================================
class AssignTechnicianSerializer(serializers.Serializer):
    technician_id = serializers.IntegerField()


# ======================================================
# Notification Serializer
# ======================================================
class NotificationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ["id",        
                  "message", 
                  "user", 
                  "read", 
                  "created_at"]
        read_only_fields = ["user", "created_at"]
