from app.shared.service_app import create_service_app
from app.routers.admin import router as admin_router
from app.routers.user_profile import router as user_profile_router
from app.main import auth_router, oauth_router, password_router

app = create_service_app(
    service_name="Auth",
    routers=[
        oauth_router,
        password_router,
        auth_router,
        user_profile_router,
        admin_router,
    ],
)
