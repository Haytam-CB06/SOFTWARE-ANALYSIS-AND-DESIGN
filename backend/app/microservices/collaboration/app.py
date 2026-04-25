from app.shared.service_app import create_service_app
from .router import router

app = create_service_app(service_name="Collaboration", routers=[router])
