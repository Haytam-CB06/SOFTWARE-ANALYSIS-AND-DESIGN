from app.shared.service_app import create_service_app
from .routers import (
    auto_generate_router,
    calendar_export_router,
    goals_router,
    study_timetables_router,
    timetable_router,
)

app = create_service_app(
    service_name="Planner",
    routers=[
        auto_generate_router,
        calendar_export_router,
        goals_router,
        study_timetables_router,
        timetable_router,
    ],
)
