import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from urllib.parse import parse_qs

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Import here to ensure Django settings are loaded
        from django.contrib.auth import get_user_model
        from rest_framework.authtoken.models import Token  # optional
        User = get_user_model()

        user = await self.get_user_from_scope(User, Token)
        if user is None or not user.is_authenticated:
            await self.close()
            return

        self.user = user
        self.group_name = f"user_{self.user.id}_notifications"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_notification(self, event):
        payload = event.get("payload", {})
        await self.send(text_data=json.dumps(payload))

    @database_sync_to_async
    def get_user_from_scope(self, User, Token):
        user = self.scope.get("user")
        if user and user.is_authenticated:
            return user

        # Optional: token auth
        query = parse_qs(self.scope.get("query_string").decode())
        token_vals = query.get("token") or query.get("auth_token")
        if not token_vals:
            return None

        token_key = token_vals[0]
        try:
            token = Token.objects.get(key=token_key)
            return token.user
        except Exception:
            return None
