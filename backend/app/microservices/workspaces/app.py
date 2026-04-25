from app.shared.service_app import create_service_app
from .routers import (
    members_router,
    permission_router,
    subworkspaces_router,
    workspace_auto_generate_config_router,
    workspace_session_status_router,
    workspaces_router,
    sessions_router,
)

app = create_service_app(
    service_name="Workspaces",
    routers=[
        members_router,
        permission_router,
        subworkspaces_router,
        workspace_auto_generate_config_router,
        workspace_session_status_router,
        workspaces_router,
        sessions_router,
    ],
)
