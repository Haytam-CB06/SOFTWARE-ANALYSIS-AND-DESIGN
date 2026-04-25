# Performance-First Backend Design

## Target Topology

UPLAN should run these backend domains only:

- Auth Service: auth, OAuth, password reset, profile, admin compatibility routes.
- Workspace Service: workspace metadata, members, permissions, shared schedules, workspace sessions.
- Planning Service: timetable, goals, schedule generation endpoints, calendar export compatibility.
- Task/Assessment Service: board tasks, assessments, notes, achievements.
- Collaboration Service: chat, realtime collaboration, presence.
- Notification/Async Jobs Service: notifications, reminders, email, background workers.

The API Gateway is also the BFF. It is not a domain service; it is the frontend-facing aggregator.

## BFF Rule

Frontend dashboard load should use one request:

```text
GET /bff/dashboard
```

The BFF calls services in parallel, compacts the response, and caches dashboard summaries for `DASHBOARD_CACHE_TTL_SECONDS` seconds.

## Latency Budgets

- Simple reads: under 100-200 ms.
- Normal dashboard/API calls: under 300-500 ms.
- Heavy operations: return immediately with a started/accepted response and finish in a background job.

## Caching Rules

Cache:

- Dashboard summaries for 15-60 seconds.
- Workspace overview.
- Schedule previews.
- Performance stats.
- Frequently opened boards.

Do not cache:

- Auth-critical actions.
- Task creation/update/delete responses.
- Chat sending.
- Permission checks unless the invalidation strategy is explicit.

## Async Job Rules

Move these out of request/response:

- PDF export.
- Excel export.
- Calendar sync.
- AI schedule generation.
- Image/CSV parsing.
- Email sending.
- Analytics aggregation.

Use Redis/Celery now. RabbitMQ can be introduced later if queue routing and durability requirements outgrow Redis.

## Data Loading Rules

- Paginate chat messages, tasks, notes, and activity logs.
- Lazy load analytics and older history.
- Select required columns only for list endpoints.
- Add indexes on `user_id`, `workspace_id`, `status`, `due_date`, `created_at`, and join keys.
- Avoid N+1 queries by joining or batch fetching related users/assignees.
