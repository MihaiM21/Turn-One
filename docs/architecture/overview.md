# Turn One — Project Overview

> What this covers: what Turn One is, the monorepo layout, the tech stack, and the shape of a request as it flows through the system end-to-end.

## What it is

Turn One is a Formula 1 companion platform: live race telemetry, a sim-racing telemetry/coaching feature, and a gamification layer (predictions, trivia, leaderboards, coins/tokens, levels) built on top of it. It's a monorepo with two independently deployable packages.

## Monorepo layout

```
turn-one-client/     Next.js 15 frontend (App Router, React 19, TypeScript)
turn-one-backend/    ASP.NET Core 9 REST API + SignalR hubs (.NET 9), Clean Architecture
docs/                Documentation (operational docs at top level; concept docs in architecture/)
docker-compose*.yml  Local/production orchestration (see docs/COOLIFY_DEPLOYMENT.md)
```

Backend is split into 4 projects under Clean Architecture:

```
Domain/          Entities + enums, no external dependencies
Application/     DTOs + service interfaces, references Domain only
Infrastructure/  EF Core DbContext, migrations, service implementations, references Domain+Application
API/             Controllers, SignalR hubs, startup/DI, references Infrastructure+Application
```

See [`backend-architecture.md`](./backend-architecture.md) for the layer breakdown and [`frontend-architecture.md`](./frontend-architecture.md) for the client's route/module layout.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 15 (App Router), React 19, TypeScript |
| Frontend styling | Tailwind CSS, Radix UI / shadcn primitives |
| Frontend charts | Recharts |
| Frontend state | React Context API + hooks (no Redux/Zustand) |
| Backend framework | ASP.NET Core 9 (.NET 9), C# |
| Backend auth | JWT Bearer + BCrypt password hashing |
| Relational DB | PostgreSQL (production, via Npgsql EF Core provider), SQLite (dev fallback) |
| Time-series DB | InfluxDB (sim telemetry tick data) |
| Real-time transport | SignalR (WebSockets) — two hubs, see [`realtime-signalr.md`](./realtime-signalr.md) |
| External F1 data | Official F1 live-timing feed, reached via a Cloudflare Worker reverse proxy; a separate third-party F1 stats API for the news/standings page |
| Logging | Serilog (console + rolling file) |
| Email | MailKit/SMTP |
| API docs | Swagger/OpenAPI |

## Request flow, at a glance

There are three distinct "shapes" of request in this system — don't assume they all go through the same path:

1. **Normal CRUD / gamification calls** (predictions, trivia, coins, leaderboard, admin, etc.)
   Browser → Next.js server (client-side `fetch` with `Authorization: Bearer <jwt>`, via `lib/data-fetcher.ts`) → ASP.NET Core API controller → EF Core → PostgreSQL.

2. **F1 stats/news data** (season standings, lap-time distributions, tyre stints — the `/news` page)
   Browser → Next.js API route proxy (`app/api/[...endpoint]/route.ts`, adds a server-side API key) → external F1 stats API → JSON back to browser. This is plain REST, polled/fetched on demand — **not** the live-timing WebSocket path. See [`news-external-data.md`](./news-external-data.md).

3. **Live F1 timing / sim telemetry** (real-time dashboards, spectating, overlays)
   Official F1 live-timing feed → Cloudflare Worker (CORS/WS proxy) → backend `F1LiveTimingService` (negotiates + holds a WebSocket, keeps in-memory + on-disk state) → `F1LiveDataHub` (SignalR) → frontend SignalR client hook → React components. Sim racing telemetry follows an analogous but separate path through `SimTelemetryHub` and InfluxDB. See [`realtime-signalr.md`](./realtime-signalr.md) and [`sim-racing-telemetry.md`](./sim-racing-telemetry.md).

For the full domain model (entities/enums) see [`domain-model.md`](./domain-model.md); for every controller and endpoint see [`api-reference.md`](./api-reference.md); for the gamification rules see [`gamification-system.md`](./gamification-system.md).
