import os
import time
from uuid import uuid4

from fastapi import FastAPI, Request
from starlette.middleware.gzip import GZipMiddleware


SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
}


def _budget_for_request(request: Request) -> int:
    path = request.url.path
    method = request.method.upper()

    if path.startswith(("/health", "/live", "/ready")):
        return int(os.getenv("PERF_BUDGET_SIMPLE_READ_MS", "200"))
    if method == "GET" and path.startswith(("/user", "/workspaces", "/notifications", "/assessments")):
        return int(os.getenv("PERF_BUDGET_SIMPLE_READ_MS", "200"))
    if path.startswith(("/bff/", "/dashboard")):
        return int(os.getenv("PERF_BUDGET_NORMAL_API_MS", "500"))
    if any(part in path for part in ("/export", "/import", "/auto-generate", "/process-email")):
        return int(os.getenv("PERF_BUDGET_HEAVY_ACK_MS", "250"))
    return int(os.getenv("PERF_BUDGET_NORMAL_API_MS", "500"))


def add_platform_middleware(app: FastAPI, *, service_name: str) -> None:
    """Add SaaS baseline middleware shared by the gateway and services."""
    app.add_middleware(
        GZipMiddleware,
        minimum_size=int(os.getenv("GZIP_MINIMUM_SIZE_BYTES", "1000")),
    )

    @app.middleware("http")
    async def platform_headers(request: Request, call_next):
        request_id = request.headers.get("x-request-id") or str(uuid4())
        started_at = time.perf_counter()

        response = await call_next(request)

        duration_ms = (time.perf_counter() - started_at) * 1000
        budget_ms = _budget_for_request(request)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time-Ms"] = f"{duration_ms:.2f}"
        response.headers["X-Service-Name"] = service_name
        response.headers["X-Performance-Budget-Ms"] = str(budget_ms)
        response.headers["X-Performance-Budget-Status"] = "ok" if duration_ms <= budget_ms else "over"

        for header, value in SECURITY_HEADERS.items():
            response.headers.setdefault(header, value)

        if os.getenv("ENABLE_HSTS", "false").lower() in {"1", "true", "yes"}:
            response.headers.setdefault(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains",
            )

        return response
