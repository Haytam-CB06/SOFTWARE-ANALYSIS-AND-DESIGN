import os
from typing import Iterable

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from starlette.middleware.sessions import SessionMiddleware

from app.db import get_session, init_engine
from app.platform import add_platform_middleware


DEFAULT_ORIGINS = [
    "https://uplan-frontend-bccb.onrender.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


def _cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS")
    if not raw:
        return DEFAULT_ORIGINS
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def create_service_app(
    *,
    service_name: str,
    routers: Iterable[APIRouter] = (),
    init_database: bool = True,
) -> FastAPI:
    """Create a consistent FastAPI app for a backend microservice."""
    load_dotenv()

    app = FastAPI(
        title=f"UPLAN {service_name} Service",
        version=os.getenv("APP_VERSION", "1.0.0"),
    )

    app.add_middleware(
        SessionMiddleware,
        secret_key=os.getenv("SESSION_SECRET", "dev-session-secret"),
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    add_platform_middleware(app, service_name=service_name)

    @app.on_event("startup")
    def _startup() -> None:
        if init_database:
            init_engine()

    @app.get("/health", tags=["platform"])
    def health() -> dict[str, str]:
        return {"status": "ok", "service": service_name}

    @app.get("/live", tags=["platform"])
    def live() -> dict[str, str]:
        return {"status": "alive", "service": service_name}

    @app.get("/ready", tags=["platform"])
    def ready() -> dict[str, str]:
        if init_database:
            try:
                db = get_session()
                try:
                    db.execute(text("SELECT 1"))
                finally:
                    db.close()
            except Exception as exc:
                raise HTTPException(
                    status_code=503,
                    detail={
                        "status": "not_ready",
                        "service": service_name,
                        "dependency": "database",
                        "error": exc.__class__.__name__,
                    },
                ) from exc
        return {"status": "ready", "service": service_name}

    for router in routers:
        app.include_router(router)

    return app
