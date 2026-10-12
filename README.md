<div align="center">

# RailYatra

### Plan an India-wide rail journey in a polished, full-stack booking simulator.

A portfolio project for exploring the railway booking experience: accounts, route search, seat selection, simulated checkout, PNR lookup and downloadable demo tickets.

[**Open the full-stack demo**](https://railyatra-api.onrender.com/) · [GitHub Pages mirror](https://rachit1807.github.io/RailYatra/) · [API readiness](https://railyatra-api.onrender.com/api/ready) · [Source code](https://github.com/rachit1807/RailYatra)

[![Pages deployment](https://github.com/rachit1807/RailYatra/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/rachit1807/RailYatra/actions/workflows/deploy-pages.yml)
[![Quality checks](https://github.com/rachit1807/RailYatra/actions/workflows/quality.yml/badge.svg)](https://github.com/rachit1807/RailYatra/actions/workflows/quality.yml)
[![API status](https://img.shields.io/website?url=https%3A%2F%2Frailyatra-api.onrender.com%2Fapi%2Fready&label=API&up_message=online&down_message=offline)](https://railyatra-api.onrender.com/api/ready)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-43853d?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169e1?logo=postgresql&logoColor=white)

</div>

> **Demo only.** RailYatra is an independent learning project, not affiliated with IRCTC. It does not connect to live railway systems. Train data, tracking and payments are simulated; tickets are not valid for travel.

## Live preview

[Open the full-stack RailYatra demo](https://railyatra-api.onrender.com/) and choose **Explore with a demo account** to try the current interface with fictional demo data. The diagrams below document the deployed architecture and the exact sample dataset.

## Built with

<p>
  <img alt="HTML5" src="https://img.shields.io/badge/HTML5-frontend-E34F26?logo=html5&logoColor=white">
  <img alt="CSS3" src="https://img.shields.io/badge/CSS3-responsive%20UI-1572B6?logo=css3&logoColor=white">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-ES%20modules-F7DF1E?logo=javascript&logoColor=222">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-runtime-339933?logo=nodedotjs&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-REST%20API-000000?logo=express&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-persistence-4169E1?logo=postgresql&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-local%20database-2496ED?logo=docker&logoColor=white">
  <img alt="GitHub Actions" src="https://img.shields.io/badge/GitHub%20Actions-deployment-2088FF?logo=githubactions&logoColor=white">
  <img alt="GitHub Pages" src="https://img.shields.io/badge/GitHub%20Pages-frontend%20hosting-222222?logo=githubpages&logoColor=white">
  <img alt="Render" src="https://img.shields.io/badge/Render-API%20hosting-46E3B7?logo=render&logoColor=111">
  <img alt="Neon" src="https://img.shields.io/badge/Neon-managed%20PostgreSQL-00E599?logo=neon&logoColor=111">
</p>

| Layer | Tools | Role |
|---|---|---|
| Frontend | HTML, CSS, vanilla JavaScript modules | Responsive booking interface and ticket downloads |
| API | Node.js, Express 5 | Authentication, booking validation and service endpoints |
| Data | PostgreSQL, `pg` | Shared accounts, reservations, seat inventory and meal orders |
| Local setup | Docker Compose | Runs a PostgreSQL database for development |
| Hosting | GitHub Pages, Render, Neon | Static frontend, API service and hosted PostgreSQL |

## What you can try

- Create an account or use the in-app demo account; sign in and out.
- Search sample routes across **41 major Indian stations**, compare **30 directional sample services**, and choose from **Sleeper, 3A, 2A and 1A**.
- Select passengers and seats; a server-side hold lasts up to five minutes while you complete the **simulated** payment flow.
- View a demo PNR and download the ticket as an image or PDF.
- Check upcoming, past and cancelled journeys; inspect recent demo transactions and request a simulated cancellation/refund.
- Explore a sample train-progress timeline, place a sample onboard meal order, and switch between light and dark themes.

### Demo network at a glance

![Chart showing 41 sample stations, 30 directional train services and 4 travel classes](docs/demo-dataset.svg)

These figures describe the curated sample data in the repository. They are not live route coverage, train availability or booking inventory.

## How it is put together

![RailYatra architecture: browser frontend, GitHub Pages, Render Express API and Neon PostgreSQL](docs/architecture.svg)

The GitHub Pages build serves the static `dist/` frontend. When configured with the hosted API, the browser sends requests to the Express service on Render, which persists shared demo records in PostgreSQL on Neon. For local development, Docker Compose can run PostgreSQL on your machine.

### Reservation and payment lifecycle

1. Availability combines confirmed bookings with active temporary holds.
2. On continuing to payment, the API validates the route, class, quota, passenger data and fare, then creates a five-minute seat hold in PostgreSQL. Seat-row locks are held only during the database transaction, never during the payment screen.
3. The checkout records its lifecycle: HELD → PAYMENT_PENDING → CONFIRMED, or FAILED / EXPIRED / CANCELLED. Payment outcomes are simulated and written to a transaction ledger.
4. On simulated success, the API locks and rechecks the inventory, creates the booking and payment ledger entry in one database transaction, and releases the hold. A retry returns the original booking.
5. Failed, abandoned or expired checkouts release inventory. Cancelling a confirmed demo booking records a simulated refund and makes the segment available again.
6. Route spans use half-open segments: Delhi → Kanpur and Kanpur → Patna may reuse the same seat; overlapping spans cannot. Inventory is keyed by train, class and the train’s origin departure date.

The row locks and database transaction provide the final protection against overlapping bookings. This is an educational implementation, not a description of IRCTC internals.

## Industry-style engineering included

- Database-backed sessions use hashed session identifiers and HttpOnly cookies; production cookies are Secure. Authenticated browser writes require an allowed Origin and a custom request header to mitigate CSRF.
- Login and registration have an IP and account based attempt limit. This in-process limiter is suitable for the single-instance demo; a scaled production deployment should use a shared rate-limit store.
- Checkout creation accepts an idempotency key. Payment completion is idempotent per checkout, and the payment/refund ledger records simulated outcomes.
- PostgreSQL schema changes run through versioned migrations. Temporary holds expire automatically, and Render readiness checks verify database connectivity.
- The API emits structured request logs with request IDs and exposes basic Prometheus-format request, latency and process metrics at /api/metrics.
- GitHub Actions runs syntax checks and unit plus PostgreSQL concurrency tests for pull requests. The GitHub Pages deployment waits for the same checks after a push to main.

For the most reliable signed-in demo, use the Render address above so the frontend and API share an origin. The GitHub Pages mirror calls the API across sites; some browsers restrict third-party cookies in that setup.

## Monitoring and operations

- Liveness: /api/health
- Readiness, including PostgreSQL: /api/ready
- Process-local metrics: /api/metrics
- Render logs contain structured request IDs for following a failed request.
- Metrics reset when the service restarts. Central alerting, measured SLOs and a tested database restore plan still need provider configuration.

See the operations notes in docs/operations.md before connecting another environment.

## Run locally

### Requirements

- Node.js 18 or newer and npm
- Docker Desktop (for the PostgreSQL-backed version)

### Full-stack mode

```bash
git clone https://github.com/rachit1807/RailYatra.git
cd RailYatra
npm ci
cp .env.example .env
docker compose up -d postgres
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The server initializes the schema at startup. Create an account with fictional details, or choose the in-app demo account. `.env` is excluded from Git; use `.env.example` as the local template.

To use a different PostgreSQL instance, set `DATABASE_URL` in `.env`. Never commit database credentials.

### Browser-only mode

Without Docker or PostgreSQL, run the local-only demo:

```bash
npm run dev:demo
```

Open [http://localhost:5174](http://localhost:5174). Accounts and bookings in this mode stay in that browser.

### Useful project commands

| Command | Purpose |
|---|---|
| npm run dev | Start the API and full-stack frontend locally |
| npm run dev:demo | Start the browser-only demo |
| npm run check | Check JavaScript syntax |
| npm test | Run unit tests; PostgreSQL integration coverage runs when TEST_DATABASE_URL is set |

For database-backed tests, point TEST_DATABASE_URL at a disposable PostgreSQL database. Never point the test suite at the hosted demo database; the integration test creates and removes fictional test records.

## Live services

| Service | URL | Hosting |
|---|---|---|
| Full-stack application | [railyatra-api.onrender.com](https://railyatra-api.onrender.com/) | Render |
| Static frontend mirror | [rachit1807.github.io/RailYatra](https://rachit1807.github.io/RailYatra/) | GitHub Pages |
| API readiness | [Check API and database](https://railyatra-api.onrender.com/api/ready) | Render → Neon PostgreSQL |
| API metrics | [Prometheus-format metrics](https://railyatra-api.onrender.com/api/metrics) | Render |

The API deployment expects DATABASE_URL to be configured as a secret in Render. The committed Render Blueprint documents service setup and the readiness check. Free hosting may sleep when idle, so the first request can take longer. Check provider terms and data retention before using hosted demo data.

## Repository map

```text
api.js                 Express API and PostgreSQL-backed booking logic
api/schema.sql         Base PostgreSQL schema
api/migrations/        Versioned schema upgrades
server.mjs             Full-stack local server
server-demo.mjs        Browser-only demo server
dist/                  Static application published to GitHub Pages
docs/                  Architecture diagrams, charts and operations notes
compose.yaml           Local PostgreSQL service
render.yaml            Render service configuration
tests/                  Unit, browser and PostgreSQL integration tests
.github/workflows/     Quality checks and gated Pages deployment
```

## Demo boundaries and security

- No live railway timetable, availability, ticket issuance, GPS feed or IRCTC integration.
- Checkout, payment, refunds, train tracking and meal delivery are simulations. No card or bank details are collected and no real money moves.
- Tickets are clearly marked as demos and cannot be used to board a train.
- Use fictional names, email addresses and passwords you do not use elsewhere.
- Session cookies and database booking locks demonstrate safer patterns, but this repository is not production-certified. It has no email verification, password reset, live gateway/webhook integration, centralized alerting, or provider-configured backup/restore runbook.
- The GitHub Pages mirror and Render API use different sites. Browser privacy settings can block cross-site cookies; the Render full-stack URL is the recommended demo entry point.

<div align="center">

**RailYatra** · Built as a railway system-design and full-stack learning project.

[Live demo](https://railyatra-api.onrender.com/) · [GitHub Pages mirror](https://rachit1807.github.io/RailYatra/) · [GitHub repository](https://github.com/rachit1807/RailYatra)

</div>
