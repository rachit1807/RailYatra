# RailYatra operations notes

RailYatra is a learning simulator. These notes describe the current hosted demo and the operational work still required before a real service could be considered.

## Health and telemetry

- `/api/health` reports that the Node process is serving requests.
- `/api/ready` checks PostgreSQL and is configured as the Render health check.
- `/api/metrics` exposes process-local Prometheus counters, latency buckets, 5xx count and uptime. Counters reset when the process restarts; no metrics scraper or alert rule is configured.
- Each HTTP response includes an `X-Request-ID`. The same identifier appears in structured Render logs. Use it to follow a request without logging passwords, cookie values or passenger details.

For a production deployment, export telemetry to a retained metrics and tracing service, define an availability SLO, set alerts for readiness failures and elevated 5xx rates, and review booking latency with real traffic. Do not treat the demo's process-local counters as an SLA.

## Booking integrity checks

The PostgreSQL integration suite covers two users racing for the same seat, adjacent route segments, payment retry idempotency, failed-payment release, checkout expiry, and session logout. GitHub Actions uses a disposable PostgreSQL service for those checks and gates the Pages deployment on success.

When investigating a reported booking issue:

1. Find the request by its request ID in Render logs.
2. Check `/api/ready` and the PostgreSQL service status.
3. Check the user's checkout event history and payment transaction status in the database.
4. Confirm that only a `CONFIRMED` booking occupies inventory; failed, cancelled and expired holds should not block a seat.
5. Preserve relevant records before applying a forward migration or correcting demo data.

## Database recovery

The repository does not configure or verify a hosted backup policy. In the Neon project, confirm the current retention and restore options before relying on any hosted demo record. For a restore exercise, restore to a separate branch/database first, point a staging copy of the API at it, run readiness and booking smoke checks, then update the production connection only after the restored data is confirmed.

Do not run the integration suite against the hosted demo database. Set `TEST_DATABASE_URL` to a disposable database; the test creates fictional users and bookings and removes them during cleanup.

## Deploy and rollback

Pushes to `main` run the PostgreSQL-backed quality checks before GitHub Pages publishes the frontend. Render deploys from the same branch and applies versioned SQL migrations during startup. Review a failing Render deploy and migration logs before retrying. Prefer a new corrective migration over deleting or recreating hosted tables.

The app currently uses one Render web process and an in-memory login rate limiter. If the API is scaled to multiple processes, move rate-limit state and scheduled cleanup to a shared service or database-backed job before depending on them for enforcement.

## Environment and secrets

- Keep `DATABASE_URL` in Render's secret environment settings.
- Keep `ALLOWED_ORIGINS` limited to the intended frontend origins.
- Use `PGSSL=require` for the hosted database connection.
- `SEAT_HOLD_SECONDS` controls temporary demo seat holds; the default hosted value is 300 seconds.
- Never print passwords, session cookies, database connection strings or payment credentials in logs.

