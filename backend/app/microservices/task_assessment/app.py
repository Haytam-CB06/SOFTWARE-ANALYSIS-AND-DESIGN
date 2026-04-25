from app.shared.service_app import create_service_app
from .routers import (
    achievements_router,
    assessments_router,
    boards_router,
    notebook_router,
)

app = create_service_app(
    service_name="Task/Assessment",
    routers=[
        boards_router,
        assessments_router,
        achievements_router,
        notebook_router,
    ],
)
