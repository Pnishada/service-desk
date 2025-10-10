from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the custom User model.
    Handles password hashing on create/update and ensures password is never exposed in responses.
    """
    password = serializers.CharField(write_only=True, required=False)
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "full_name",
            "email",
            "role",
            "branch",
            "branch_name",
            "password",
            "is_active",
            "date_joined",
        ]
        read_only_fields = ["id", "date_joined"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        """Hash password before creating a new user."""
        password = validated_data.pop("password", None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        """Hash password if updated."""
        password = validated_data.pop("password", None)
        if password:
            instance.set_password(password)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extends JWT authentication to include `role` and `branch`
    in both the token claims and the login response payload.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = getattr(user, "role", "")
        token["branch"] = getattr(user.branch, "name", None)
        return token

    def validate(self, attrs):
        """Customize login response with user details."""
        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "username": getattr(self.user, "username", ""),
            "full_name": getattr(self.user, "full_name", ""),
            "email": getattr(self.user, "email", ""),
            "role": getattr(self.user, "role", ""),
            "branch": getattr(self.user.branch, "name", None),
            "is_active": getattr(self.user, "is_active", True),
        }
        return data
