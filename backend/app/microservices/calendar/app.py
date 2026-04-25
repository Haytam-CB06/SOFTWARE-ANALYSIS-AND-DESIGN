from app.shared.service_app import create_service_app
from .routers import (
    calendar_export_router,
)

app = create_service_app(service_name="Calendar", routers=[calendar_export_router])
