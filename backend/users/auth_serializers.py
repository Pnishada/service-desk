from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = getattr(user, "role", "").lower()
        token["branch"] = getattr(user.branch, "name", None) if user.branch else None
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "full_name": getattr(self.user, "full_name", ""),
            "email": getattr(self.user, "email", ""),
            "role": getattr(self.user, "role", "").lower(),
            "branch": getattr(self.user.branch, "name", None) if getattr(self.user, "branch", None) else None,
            "is_active": self.user.is_active,
        }
        return data
