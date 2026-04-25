import asyncio
import json
import os
import time
from dataclasses import dataclass
from typing import Any
from urllib.parse import quote

import httpx
import websockets
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.platform import add_platform_middleware

load_dotenv()


DEFAULT_ORIGINS = [
    "https://uplan-frontend-bccb.onrender.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


@dataclass(frozen=True)
class ServiceRoute:
    name: str
    base_url: str
    prefixes: tuple[str, ...]


def _env_url(name: str, default: str) -> str:
    return os.getenv(name, default).rstrip("/")


AUTH_SERVICE_URL = _env_url("AUTH_SERVICE_URL", "http://127.0.0.1:8009")
WORKSPACE_SERVICE_URL = _env_url("WORKSPACE_SERVICE_URL", "http://127.0.0.1:8002")
PLANNING_SERVICE_URL = _env_url("PLANNING_SERVICE_URL", "http://127.0.0.1:8001")
TASK_ASSESSMENT_SERVICE_URL = _env_url("TASK_ASSESSMENT_SERVICE_URL", "http://127.0.0.1:8005")
COLLABORATION_SERVICE_URL = _env_url("COLLABORATION_SERVICE_URL", "http://127.0.0.1:8003")
NOTIFICATION_SERVICE_URL = _env_url("NOTIFICATION_SERVICE_URL", "http://127.0.0.1:8004")

SERVICE_ROUTES = [
    ServiceRoute(
        "auth",
        AUTH_SERVICE_URL,
        (
            "/auth",
            "/login",
            "/request_reset",
            "/verify_code",
            "/reset_password",
            "/change-password",
            "/me/events",
            "/events",
            "/user",
            "/admin",
        ),
    ),
    ServiceRoute(
        "planning",
        PLANNING_SERVICE_URL,
        ("/auto-generate", "/goals", "/study-timetables", "/timetable", "/calendar"),
    ),
    ServiceRoute(
        "workspace",
        WORKSPACE_SERVICE_URL,
        ("/workspaces", "/members", "/sessions"),
    ),
    ServiceRoute(
        "task_assessment",
        TASK_ASSESSMENT_SERVICE_URL,
        ("/assessments", "/achievements", "/notes"),
    ),
    ServiceRoute(
        "collaboration",
        COLLABORATION_SERVICE_URL,
        ("/chat",),
    ),
    ServiceRoute(
        "notification_async",
        NOTIFICATION_SERVICE_URL,
        ("/notifications",),
    ),
]

HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "content-length",
    # httpx transparently decompresses upstream bodies. Forwarding the original
    # gzip/br/deflate header makes browsers try to decode already-decoded JSON.
    "content-encoding",
}
_MEMORY_CACHE: dict[str, tuple[float, Any]] = {}
_GATEWAY_HTTP_CLIENT: httpx.AsyncClient | None = None

app = FastAPI(title="UPLAN API Gateway", version=os.getenv("APP_VERSION", "1.0.0"))
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", ",".join(DEFAULT_ORIGINS)).split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
add_platform_middleware(app, service_name="gateway")


def _get_gateway_client() -> httpx.AsyncClient:
    global _GATEWAY_HTTP_CLIENT
    client = getattr(app.state, "gateway_http_client", None)
    if client is not None:
        return client
    if _GATEWAY_HTTP_CLIENT is None:
        _GATEWAY_HTTP_CLIENT = httpx.AsyncClient(trust_env=False)
    return _GATEWAY_HTTP_CLIENT


@app.on_event("startup")
async def _startup_gateway_client() -> None:
    app.state.gateway_http_client = httpx.AsyncClient(trust_env=False)


@app.on_event("shutdown")
async def _shutdown_gateway_client() -> None:
    client = getattr(app.state, "gateway_http_client", None)
    if client is not None:
        await client.aclose()

    global _GATEWAY_HTTP_CLIENT
    if _GATEWAY_HTTP_CLIENT is not None:
        await _GATEWAY_HTTP_CLIENT.aclose()
        _GATEWAY_HTTP_CLIENT = None


def _match_route(path: str) -> ServiceRoute | None:
    if path.startswith("/workspaces/") and "/board" in path:
        return next(route for route in SERVICE_ROUTES if route.name == "task_assessment")

    matches = [
        route
        for route in SERVICE_ROUTES
        if any(path == prefix or path.startswith(f"{prefix}/") for prefix in route.prefixes)
    ]
    if not matches:
        return None
    return max(matches, key=lambda route: max(len(prefix) for prefix in route.prefixes))


def _target_for(path: str) -> tuple[str, str]:
    route = _match_route(path)
    if route is None:
        return "auth", AUTH_SERVICE_URL
    return route.name, route.base_url


def _filtered_headers(headers: dict[str, str]) -> dict[str, str]:
    return {
        key: value
        for key, value in headers.items()
        if key.lower() not in HOP_BY_HOP_HEADERS and key.lower() != "host"
    }


@app.get("/health", tags=["platform"])
async def health() -> dict[str, object]:
    return {
        "status": "ok",
        "service": "gateway",
        "routes": {route.name: route.base_url for route in SERVICE_ROUTES},
        "bff": "/bff/dashboard",
    }


@app.get("/ready", tags=["platform"], response_model=None)
async def ready():
    async def check_route(client: httpx.AsyncClient, route: ServiceRoute) -> tuple[str, dict[str, object]]:
        try:
            response = await client.get(f"{route.base_url}/ready", timeout=timeout)
            return route.name, {
                "status": "ready" if response.status_code < 500 else "not_ready",
                "code": response.status_code,
            }
        except httpx.RequestError as exc:
            return route.name, {
                "status": "not_ready",
                "error": exc.__class__.__name__,
            }

    timeout = float(os.getenv("GATEWAY_HEALTH_TIMEOUT_SECONDS", "0.5"))
    client = _get_gateway_client()
    results = await asyncio.gather(*(check_route(client, route) for route in SERVICE_ROUTES))
    checks = dict(results)

    overall = "ready" if all(item["status"] == "ready" for item in checks.values()) else "degraded"
    payload = {"status": overall, "service": "gateway", "checks": checks}
    if overall != "ready":
        return JSONResponse(payload, status_code=503)
    return payload


@app.get("/service-map", tags=["platform"])
async def service_map() -> dict[str, object]:
    return {
        route.name: {
            "url": route.base_url,
            "prefixes": route.prefixes,
        }
        for route in SERVICE_ROUTES
    }


async def _redis_get_json(key: str) -> Any | None:
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        cached = _MEMORY_CACHE.get(key)
        if not cached:
            return None
        expires_at, value = cached
        if expires_at < time.time():
            _MEMORY_CACHE.pop(key, None)
            return None
        return value

    try:
        import redis.asyncio as redis  # type: ignore

        client = redis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=0.2,
            socket_timeout=0.2,
        )
        raw = await client.get(key)
        await client.aclose()
        return json.loads(raw) if raw else None
    except Exception:
        cached = _MEMORY_CACHE.get(key)
        if not cached:
            return None
        expires_at, value = cached
        if expires_at < time.time():
            _MEMORY_CACHE.pop(key, None)
            return None
        return value


async def _redis_set_json(key: str, value: Any, ttl_seconds: int) -> None:
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        _MEMORY_CACHE[key] = (time.time() + ttl_seconds, value)
        return

    try:
        import redis.asyncio as redis  # type: ignore

        client = redis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=0.2,
            socket_timeout=0.2,
        )
        await client.setex(key, ttl_seconds, json.dumps(value, default=str))
        await client.aclose()
    except Exception:
        _MEMORY_CACHE[key] = (time.time() + ttl_seconds, value)


async def _fetch_json(
    client: httpx.AsyncClient,
    base_url: str,
    path: str,
    headers: dict[str, str],
    fallback: Any,
    timeout: float,
) -> Any:
    try:
        response = await client.get(f"{base_url}{path}", headers=headers, timeout=timeout)
        if response.status_code >= 400:
            return fallback
        return response.json()
    except Exception:
        return fallback


def _first_workspace_id(workspaces: Any) -> str | None:
    if isinstance(workspaces, list) and workspaces:
        workspace = workspaces[0]
        if isinstance(workspace, dict) and workspace.get("id"):
            return str(workspace["id"])
    return None


def _as_list(value: Any, *keys: str) -> list[Any]:
    if isinstance(value, list):
        return value
    if isinstance(value, dict):
        for key in keys:
            item = value.get(key)
            if isinstance(item, list):
                return item
    return []


def _compact_list(value: Any, limit: int = 8, *keys: str) -> list[Any]:
    return _as_list(value, *keys)[:limit]


@app.get("/bff/dashboard", tags=["bff"])
async def dashboard_bff(request: Request, workspace_id: str | None = None, refresh: bool = False):
    """One compact dashboard payload for the frontend.

    This keeps page load fast by replacing several frontend calls with one
    gateway call that fans out to domain services in parallel and caches
    expensive summaries briefly.
    """
    user_id = request.headers.get("x-user-id") or request.query_params.get("user_id") or "anonymous"
    cache_ttl = int(os.getenv("DASHBOARD_CACHE_TTL_SECONDS", "60"))
    cache_key = f"bff:dashboard:{user_id}:{workspace_id or 'default'}"

    if not refresh:
        cached = await _redis_get_json(cache_key)
        if cached is not None:
            return cached | {"cache": {"hit": True, "ttl_seconds": cache_ttl}}

    forward_headers = _filtered_headers(dict(request.headers))
    if user_id != "anonymous":
        forward_headers["x-user-id"] = user_id

    user_q = quote(user_id, safe="")
    timeout = float(os.getenv("BFF_TIMEOUT_SECONDS", "1.5"))
    client = _get_gateway_client()
    workspaces_task = _fetch_json(client, WORKSPACE_SERVICE_URL, "/workspaces", forward_headers, [], timeout)
    notifications_task = _fetch_json(
            client,
            NOTIFICATION_SERVICE_URL,
            f"/notifications/?user_id={user_q}&limit=8&due_only=true",
            forward_headers,
            [],
            timeout,
    )
    schedule_task = _fetch_json(
        client,
        PLANNING_SERVICE_URL,
        f"/study-timetables/user/{user_q}",
        forward_headers,
        [],
        timeout,
    )
    assessments_task = _fetch_json(
            client,
            TASK_ASSESSMENT_SERVICE_URL,
            f"/assessments?user_id={user_q}&include_completed=true&include_past=true",
            forward_headers,
            {"assessments": []},
            timeout,
    )
    week_summary_task = _fetch_json(
            client,
            WORKSPACE_SERVICE_URL,
            f"/sessions/summary?user_id={user_q}",
            forward_headers,
            None,
            timeout,
    )
    week_goals_task = _fetch_json(
            client,
            PLANNING_SERVICE_URL,
            f"/goals?user_id={user_q}",
            forward_headers,
            {"goals": []},
            timeout,
    )

    workspaces, notifications, schedules, assessments, week_summary, week_goals = await asyncio.gather(
        workspaces_task,
        notifications_task,
        schedule_task,
        assessments_task,
        week_summary_task,
        week_goals_task,
    )

    workspaces_list = _compact_list(workspaces, 5)
    selected_workspace_id = workspace_id or _first_workspace_id(workspaces_list)
    tasks = []
    chat = []
    if selected_workspace_id:
        tasks, chat = await asyncio.gather(
            _fetch_json(
                client,
                TASK_ASSESSMENT_SERVICE_URL,
                f"/workspaces/{selected_workspace_id}/board/tasks",
                forward_headers,
                [],
                timeout,
            ),
            _fetch_json(
                client,
                COLLABORATION_SERVICE_URL,
                f"/chat/workspaces/{selected_workspace_id}/messages?limit=10",
                forward_headers,
                [],
                timeout,
            ),
        )

    payload = {
        "user_id": user_id,
        "workspace_id": selected_workspace_id,
        "dashboard": {
            "workspaces": workspaces_list,
            "today_schedule": _compact_list(schedules, 8, "timetables", "sessions"),
            "assigned_tasks": _compact_list(tasks, 8, "tasks"),
            "assessments": _compact_list(assessments, 8, "assessments"),
            "notifications": _compact_list(notifications, 8, "notifications"),
            "recent_chat": _compact_list(chat, 5),
            "week_summary": week_summary,
            "week_goals": week_goals,
        },
        "meta": {
            "source": "bff",
            "services_called": ["workspace", "planning", "task_assessment", "collaboration", "notification_async"],
        },
        "cache": {"hit": False, "ttl_seconds": cache_ttl},
    }
    await _redis_set_json(cache_key, payload, cache_ttl)
    return payload


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy(path: str, request: Request) -> Response:
    request_path = f"/{path}"
    service_name, base_url = _target_for(request_path)
    target_url = httpx.URL(
        f"{base_url}{request_path}",
        query=request.url.query.encode("utf-8"),
    )

    try:
        client = _get_gateway_client()
        proxied = await client.request(
            method=request.method,
            url=target_url,
            headers={
                **_filtered_headers(dict(request.headers)),
                "accept-encoding": "identity",
                "x-gateway-service": service_name,
            },
            content=await request.body(),
            timeout=float(os.getenv("GATEWAY_TIMEOUT_SECONDS", "15")),
        )
    except httpx.RequestError as exc:
        return Response(
            content=f'{{"detail":"{service_name} service unavailable","error":"{exc.__class__.__name__}"}}',
            status_code=502,
            media_type="application/json",
        )

    return Response(
        content=proxied.content,
        status_code=proxied.status_code,
        headers=_filtered_headers(dict(proxied.headers)),
        media_type=proxied.headers.get("content-type"),
    )


@app.websocket("/{path:path}")
async def websocket_proxy(path: str, websocket: WebSocket) -> None:
    request_path = f"/{path}"
    service_name, base_url = _target_for(request_path)
    ws_base = base_url.replace("http://", "ws://").replace("https://", "wss://")
    query = websocket.url.query
    target_url = f"{ws_base}{request_path}{'?' + query if query else ''}"

    await websocket.accept()

    async def client_to_service(upstream) -> None:
        while True:
            message = await websocket.receive()
            if "text" in message and message["text"] is not None:
                await upstream.send(message["text"])
            elif "bytes" in message and message["bytes"] is not None:
                await upstream.send(message["bytes"])
            elif message.get("type") == "websocket.disconnect":
                await upstream.close()
                return

    async def service_to_client(upstream) -> None:
        async for message in upstream:
            if isinstance(message, bytes):
                await websocket.send_bytes(message)
            else:
                await websocket.send_text(message)

    try:
        async with websockets.connect(
            target_url,
            additional_headers={"x-gateway-service": service_name},
        ) as upstream:
            await asyncio.gather(
                client_to_service(upstream),
                service_to_client(upstream),
            )
    except WebSocketDisconnect:
        return
    except Exception:
        try:
            await websocket.close()
        except RuntimeError:
            pass
