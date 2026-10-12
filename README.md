# RailYatra

An independent India-wide railway booking demo. It now has a Node.js/Express API and PostgreSQL-backed accounts, bookings, seat inventory, cancellations and meal orders. Train schedules, tracking and payments remain simulated. It is not affiliated with IRCTC, does not connect to live railway services, and its tickets are not valid for travel.

## Run the full-stack app locally

Requires Node.js 18+, npm and Docker Desktop.

```sh
npm ci
cp .env.example .env
docker compose up -d postgres
npm run dev
```

Open http://localhost:5173. The first server start creates the database tables. Create a demo account with a fictional email and password of at least eight characters. The demo sign-in button uses one shared public demo account, so do not enter personal information there.

If you open the static files with VS Code Live Server, the app uses browser-local demo storage. Use `npm run dev` with PostgreSQL to try the full-stack version. Set `DATABASE_URL` in `.env` to use a different PostgreSQL server. `.env` is ignored by Git.

To run the browser-only version without Docker/PostgreSQL, use `npm run dev:demo` and open http://localhost:5174.

The browser integration page is available at http://localhost:5173/__reservation-test when the local server is running. `npm test` runs the existing browser-storage engine tests; `npm run check` checks JavaScript syntax.

## Booking and seat safety

The API validates passenger details, train, route, class, quota and fare on the server. A successful simulated payment calls the booking endpoint. PostgreSQL transactions lock the selected train/date/class/seat rows in a consistent order, then recheck overlapping route segments before confirming the booking. This prevents two concurrent accounts from receiving the same seat on overlapping portions of a journey. Adjacent segments may reuse a seat. Cancellation locks the same inventory rows, marks the booking cancelled and updates linked meal orders atomically. A payment reference makes checkout retries idempotent.

The app still serves sample timetables for 41 major stations and 30 directional services. Tracking is an interactive sample timeline, not live GPS. Food orders do not charge or deliver meals. The payment screen is simulated and collects no card or bank details.

## Hosting

**Frontend demo:** [https://rachit1807.github.io/RailYatra/](https://rachit1807.github.io/RailYatra/)

GitHub Pages publishes the static `dist` directory. `render.yaml` describes the separate API service; it requires a `DATABASE_URL` for PostgreSQL. After the API is deployed, set `window.RY_API_BASE` in `dist/config.js` to its HTTPS origin and push that change so GitHub Pages uses shared server data.

Do not point this app at another project's database. Render's free PostgreSQL databases expire after 30 days, so they are suitable only for temporary demos; use a persistent database for data you need to keep. See [Render's current free-instance limits](https://render.com/docs/free).

## Demo limits

Bookings and accounts are shared only when the frontend is configured to use the API. Without that setting, the static GitHub Pages version uses this browser's IndexedDB. The API stores password hashes and expiring sessions, but its bearer token is kept in browser storage; this is a learning demo, not production authentication. Do not use real passwords or personal passenger details.

Real railway availability, ticket issuance, live tracking and payment settlement require authorized external integrations and production security/reconciliation work. No real payment provider is connected.
