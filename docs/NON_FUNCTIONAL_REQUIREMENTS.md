# Non-Functional Requirements and SaaS Readiness

This checklist defines the minimum non-functional requirements for deploying UPLAN as a SaaS product.

## Performance

- Public gateway health endpoints should respond with p95 latency under 750 ms from the deployment region.
- Authenticated dashboard APIs should respond with p95 latency under 1200 ms under normal load.
- No endpoint should return sustained 5xx errors during a 10 minute load test.
- Static frontend assets must be built with `npm run build` and served compressed by the hosting platform or CDN.

## Load and Scalability

- Baseline load test: 25 users for 5 minutes.
- Release load test: 100 users for 10 minutes.
- Stress test: increase by 50 users every 5 minutes until p95 exceeds budget or error rate exceeds 1%.
- Gateway, services, PostgreSQL, Redis, and Celery workers must be independently scalable.

## Availability and Reliability

- `/health` is a liveness endpoint and must return 200 when the process is alive.
- `/ready` is a dependency readiness endpoint and may return 503 when a required dependency is unavailable.
- Docker Compose healthchecks are enabled for every backend service.
- Background notification work should run through Celery/Redis in production, not the in-process development poller.

## Security

- Required HTTP headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`.
- Enable `Strict-Transport-Security` in production with `ENABLE_HSTS=true` after HTTPS is configured.
- `SESSION_SECRET`, OAuth secrets, SMTP credentials, Cloudinary credentials, and database passwords must come from the deployment secret store.
- Never deploy with `SESSION_SECRET=dev-session-secret`.
- Run `bandit` and `pip-audit` before production releases.

## Observability

- Every HTTP response includes `X-Request-ID`, `X-Response-Time-Ms`, and `X-Service-Name`.
- Logs from gateway and services should be centralized by the hosting platform.
- Production incidents should be traced using `X-Request-ID`.

## Data and Backup

- PostgreSQL must use managed backups with restore testing.
- User uploads should use durable object storage, not local container disk.
- Database migrations must run before a release and be reversible or backed by a tested restore plan.

## Compatibility

- Frontend production build must pass.
- Backend smoke checks must pass against the deployed gateway.
- CORS origins must be restricted to production frontend domains.

## Commands

Install test tooling:

```powershell
python -m pip install -r backend/requirements-dev.txt
```

Run local NFR unit checks:

```powershell
python -m pytest tests/nfr
```

Run smoke checks against a running gateway:

```powershell
python scripts/nfr-smoke.py --base-url http://127.0.0.1:8000
```

Run a baseline load test:

```powershell
locust -f tests/nfr/locustfile.py --host http://127.0.0.1:8000 --headless -u 25 -r 5 -t 5m --html reports/load-baseline.html
```

Run security dependency checks:

```powershell
bandit -r backend/app
pip-audit -r backend/requirements.txt
```
