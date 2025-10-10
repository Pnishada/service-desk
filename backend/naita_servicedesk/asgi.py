import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

# -----------------------------
# Django setup
# -----------------------------
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "naita_servicedesk.settings")
django.setup()

# -----------------------------
# Django ASGI application
# -----------------------------
django_asgi_app = get_asgi_application()

# -----------------------------
# Import WebSocket routes
# -----------------------------
import notifications.routing

# -----------------------------
# Main ASGI application
# -----------------------------
application = ProtocolTypeRouter(
    {
        # HTTP → normal Django views
        "http": django_asgi_app,

        # WebSocket → handled by Channels + middleware
        "websocket": AuthMiddlewareStack(
            URLRouter(
                notifications.routing.websocket_urlpatterns
            )
        ),
    }
)
