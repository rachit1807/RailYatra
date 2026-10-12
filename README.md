# RailYatra

A responsive, independent India-wide railway booking **demo**. No IRCTC logos, live railway APIs, real payments or travel-valid tickets. All train identifiers, names, schedules, fares, quotas and tracking are illustrative.

## Run

Requires Node 18+; no dependencies or installation needed.

```
npm run dev
```

Open http://localhost:5173. Use **Explore with a demo account** or create a fictional account. The demo account includes one clearly marked past sample journey. Search among 41 major stations and 30 directional sample services. Searches return direct trains only. PDF and PNG exports are created locally with an embedded valid version 1-L QR encoding `DEMO:<PNR>`. The appearance toggle follows your device preference initially and remembers your selection in this browser.

```
npm test
npm run check
```

For the browser integration checks, open http://localhost:5173/__reservation-test while the local server is running. It races overlapping checkouts, checks adjacent seat reuse and checkout idempotency, and verifies atomic cancellation of seats and linked meals. It removes only its own uniquely tagged QA records.

## Reservation model

Inventory is keyed by train + origin departure date + class + seat. Each class has 24 sample seats. Route occupancy uses half-open station index intervals `[from, to)`. Overlap is `a.from < b.to && b.from < a.to`. Adjacent segments can reuse a seat; overlapping journeys cannot. Origin dates account for boarding after midnight. A later boarding point does not shorten the booked segment.

The successful payment simulation opens a single IndexedDB read/write transaction, reloads all bookings, checks every selected seat, checks checkout idempotency and inserts the complete reservation. IndexedDB serializes competing read/write transactions on the store across tabs of the same browser origin. Cancellation and associated food cancellation are also atomic. No real payment data is collected. Failed simulations create no reservation. There is no seat hold before successful checkout; conflicts require selecting seats again. General and simulated Tatkal share inventory; Tatkal adds an illustrative charge.

**Limits:** data is browser-local, not shared across devices, browser profiles or origins. Users can edit or erase their own browser data. A real system needs shared server-side ACID transactions/locks, authentication and authorization, expiring seat holds, payment reconciliation and idempotency, cancellation rules and audit logs. Demo salted SHA-256 password digests are not production-grade password storage. Do not use real passwords or personal data.

IndexedDB stores accounts, bookings and food orders. localStorage stores the current demo session. Logout preserves journeys; clearing site data erases them. PNR enquiry only exposes the signed-in account’s records. Tracking is an explicitly interactive station simulation, not live GPS. Cancellation is allowed only before scheduled departure and records a full simulated refund. History uses scheduled departure to classify past/upcoming journeys. Food orders do not charge or deliver meals.

## Hosting

Static deploy root: `dist`. `.openai/hosting.json` retains the Sites identity. The static server is intended for local development only. External fonts are optional; system fonts are fallback. All booking/export features work without external runtime libraries.

For GitHub, connect an authenticated GitHub account or supply a writable repository remote; this folder initially had no Git repository or GitHub credentials/tooling. Never put tokens in source or remote URLs.
