from app.shared.service_app import create_service_app
from .routers import (
    achievements_router,
    assessments_router,
    notebook_router,
)

app = create_service_app(
    service_name="Productivity",
    routers=[
        achievements_router,
        assessments_router,
        notebook_router,
    ],
)
