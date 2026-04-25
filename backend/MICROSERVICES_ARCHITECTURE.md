# UPLAN Microservices Architecture

This backend now uses a pragmatic microservices topology with an API gateway and domain services. The gateway keeps the frontend contract stable on port `8000`, while each domain runs as a separate FastAPI process behind it.

## Runtime Topology

- `gateway` (`app.gateway.app:app`, port `8000`): public entrypoint, route proxy, service map, gateway health.
- `auth-service` (`app.microservices.auth.app:app`, port `8009`): auth and Google OAuth routes.
- `planner-service` (`app.microservices.planner.app:app`, port `8001`): timetable generation, goals, study timetables.
- `workspaces-service` (`app.microservices.workspaces.app:app`, port `8002`): workspaces, members, boards, workspace sessions.
- `chat-service` (`app.microservices.chat.app:app`, port `8003`): chat HTTP and websocket routes.
- `notifications-service` (`app.microservices.notifications.app:app`, port `8004`): notification APIs.
- `users-service` (`app.microservices.users.app:app`, port `8005`): user profile APIs.
- `calendar-service` (`app.microservices.calendar.app:app`, port `8006`): Google Calendar export APIs.
- `productivity-service` (`app.microservices.productivity.app:app`, port `8007`): assessments, achievements, notes.
- `admin-service` (`app.microservices.admin.app:app`, port `8008`): admin APIs.
- `legacy-service` (`app.main:app`, port `8010`): strangler fallback for routes that have not been fully extracted yet.
- `postgres`: shared production database.
- `redis`: background job and cache infrastructure.

## Gateway Routing

The frontend should keep using one backend base URL:

```text
VITE_API_BASE_URL=http://localhost:8000
```

Gateway route ownership:

- `/auth`, `/login`, `/request_reset`, `/verify_code`, `/reset_password`, `/change-password`, `/me/events`, `/events` -> auth
- `/auto-generate`, `/goals`, `/study-timetables`, `/timetable` -> planner
- `/workspaces`, `/members`, `/sessions` -> workspaces
- `/chat` -> chat
- `/notifications` -> notifications
- `/user` -> users
- `/calendar` -> calendar
- `/achievements`, `/assessments`, `/notes` -> productivity
- `/admin` -> admin
- everything else -> legacy fallback

The fallback is intentional. It lets the app run while the remaining monolith endpoints are extracted safely over time.

## Service Standard

All extracted services use `app.shared.service_app.create_service_app`, which provides:

- consistent CORS configuration via `CORS_ORIGINS`
- session middleware via `SESSION_SECRET`
- database startup through `DATABASE_URL`
- `/health`, `/live`, and database-backed `/ready`
- one service-owned FastAPI entrypoint per domain

The gateway exposes `/ready` as an aggregate readiness endpoint. It calls each service readiness endpoint and returns `503` when any dependency is unavailable, which makes it suitable for deployment health checks.

## Local Run

From `backend/`:

```powershell
Copy-Item .env.example .env
docker compose -f docker-compose.microservices.yml up --build
```

Useful checks:

```powershell
curl http://localhost:8000/health
curl http://localhost:8000/ready
curl http://localhost:8000/service-map
```

For local non-Docker development on Windows, run from the repository root:

```powershell
.\scripts\dev-setup.ps1
```

That script starts the same gateway and service ports as Docker:

- gateway: `8000`
- planner: `8001`
- workspaces: `8002`
- chat: `8003`
- notifications: `8004`
- users: `8005`
- calendar: `8006`
- productivity: `8007`
- admin: `8008`
- auth: `8009`
- legacy fallback: `8010`

## Next Extraction Steps

The project is now operationally split, but true service independence should continue with these steps:

1. Move auth routes out of `app.main` into `app.microservices.auth`.
2. Replace shared ORM model access with service-owned data modules.
3. Split Alembic migrations by service once database ownership is separated.
4. Move service-to-service calls to explicit internal clients instead of shared imports.
5. Add CI checks that boot every service and test gateway routing.
