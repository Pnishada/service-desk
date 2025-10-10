from rest_framework import serializers
from .models import Branch

class BranchSerializer(serializers.ModelSerializer):
    """
    Serializer for Branch model.
    Explicitly includes fields for create, update, and read operations.
    """
    class Meta:
        model = Branch
        fields = ["id", "name", "location"]
        read_only_fields = ["id"]
