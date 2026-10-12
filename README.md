<div align="center">

# RailYatra

### Plan an India-wide rail journey in a polished, full-stack booking simulator.

A portfolio project for exploring the railway booking experience: accounts, route search, seat selection, simulated checkout, PNR lookup and downloadable demo tickets.

[**Open the live demo**](https://rachit1807.github.io/RailYatra/) · [API health](https://railyatra-api.onrender.com/api/health) · [Source code](https://github.com/rachit1807/RailYatra)

[![Pages deployment](https://github.com/rachit1807/RailYatra/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/rachit1807/RailYatra/actions/workflows/deploy-pages.yml)
[![API status](https://img.shields.io/website?url=https%3A%2F%2Frailyatra-api.onrender.com%2Fapi%2Fhealth&label=API&up_message=online&down_message=offline)](https://railyatra-api.onrender.com/api/health)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-43853d?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169e1?logo=postgresql&logoColor=white)

</div>

> **Demo only.** RailYatra is an independent learning project, not affiliated with IRCTC. It does not connect to live railway systems. Train data, tracking and payments are simulated; tickets are not valid for travel.

## Live preview

[Open RailYatra](https://rachit1807.github.io/RailYatra/) and choose **Explore with a demo account** to try the current interface with fictional demo data. The diagrams below document the deployed architecture and the exact sample dataset.

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
- Select passengers and seats, then complete a **simulated** payment flow.
- View a demo PNR and download the ticket as an image or PDF.
- Check upcoming, past and cancelled journeys; inspect recent demo transactions and request a simulated cancellation/refund.
- Explore a sample train-progress timeline, place a sample onboard meal order, and switch between light and dark themes.

### Demo network at a glance

![Chart showing 41 sample stations, 30 directional train services and 4 travel classes](docs/demo-dataset.svg)

These figures describe the curated sample data in the repository. They are not live route coverage, train availability or booking inventory.

## How it is put together

![RailYatra architecture: browser frontend, GitHub Pages, Render Express API and Neon PostgreSQL](docs/architecture.svg)

The GitHub Pages build serves the static `dist/` frontend. When configured with the hosted API, the browser sends requests to the Express service on Render, which persists shared demo records in PostgreSQL on Neon. For local development, Docker Compose can run PostgreSQL on your machine.

### Seat booking flow

1. Search and view sample train availability.
2. Select a train, travel class, passengers and seats.
3. The browser sends the request to the API; the API validates the route, class, quota, passenger data and fare.
4. In a PostgreSQL transaction, the API locks the relevant seat inventory rows, rechecks overlapping route segments, and confirms the booking. This lets adjacent, non-overlapping journey segments reuse the same seat while blocking overlapping allocations.
5. The app shows a demo PNR and ticket. Payment is simulated; no card or bank details are collected.

This demonstrates a seat-safety approach for a project. It is not a description of IRCTC's internal implementation.

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
| `npm run dev` | Start the API and full-stack frontend locally |
| `npm run dev:demo` | Start the browser-storage demo |
| `npm run check` | Check JavaScript syntax |
| `npm test` | Run the existing browser-storage tests |

## Live services

| Service | URL | Hosting |
|---|---|---|
| Frontend | [rachit1807.github.io/RailYatra](https://rachit1807.github.io/RailYatra/) | GitHub Pages |
| API | [railyatra-api.onrender.com](https://railyatra-api.onrender.com) | Render |
| API health | [Check API and database status](https://railyatra-api.onrender.com/api/health) | Render → Neon PostgreSQL |

The API deployment expects `DATABASE_URL` to be configured as a secret in Render. The committed `render.yaml` documents the backend service setup. Free hosting may sleep when idle, so the first request can take longer. Check provider terms and data retention before using hosted demo data.

## Repository map

```text
api.js                 Express API and PostgreSQL-backed booking logic
api/schema.sql         Database schema
server.mjs             Full-stack local server
server-demo.mjs        Browser-only demo server
dist/                  Static application published to GitHub Pages
docs/                  README diagrams and data visualizations
compose.yaml           Local PostgreSQL service
render.yaml            Render service configuration
.github/workflows/     GitHub Pages deployment workflow
```

## Demo boundaries and security

- No live railway timetable, availability, ticket issuance, GPS feed or IRCTC integration.
- The checkout, payment, refunds, train tracking and meal delivery are simulations. No real money is charged.
- Shared accounts and bookings are stored in the hosted demo database when the API is online. Use fictional names, email addresses and passwords you do not use elsewhere.
- This project is for learning and portfolio demonstration. Its browser-stored bearer token and demo authentication are not production-grade security controls.

---

<div align="center">

**RailYatra** · Built as a railway system-design and full-stack learning project.

[Live demo](https://rachit1807.github.io/RailYatra/) · [GitHub repository](https://github.com/rachit1807/RailYatra)

</div>
