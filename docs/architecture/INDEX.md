# Turn One — Architecture & Concepts Index

This folder documents how the Turn One codebase actually works today (verified against source, not assumed from the older `docs/*.md` operational files, which cover deployment/CI/SEO/versioning and are left in place). Start here, then jump to the file that covers your topic.

For build/run commands, environment variables, and repo-level conventions, see the root [`CLAUDE.md`](../../CLAUDE.md).

## Files

| File | Covers |
|---|---|
| [`overview.md`](./overview.md) | Monorepo layout, tech stack table, high-level request-flow shapes (CRUD / news REST / real-time WebSocket) |
| [`frontend-architecture.md`](./frontend-architecture.md) | Next.js App Router route groups, auth flow, the three data-fetching patterns, naming conventions, state management |
| [`backend-architecture.md`](./backend-architecture.md) | Clean Architecture layers, `Program.cs` DI/middleware order, config sources, background services, health checks |
| [`domain-model.md`](./domain-model.md) | Every entity + enum, `PlanDetails` table, frontend↔backend type mapping |
| [`api-reference.md`](./api-reference.md) | Every controller's routes, verbs, and auth requirements |
| [`realtime-signalr.md`](./realtime-signalr.md) | `F1LiveDataHub` and `SimTelemetryHub` — events, groups, client hooks, and the Cloudflare-Worker-to-UI trace for live F1 timing |
| [`gamification-system.md`](./gamification-system.md) | Predictions, trivia, leaderboards, coins vs. tokens, level/XP, daily gifts, subscription plans |
| [`sim-racing-telemetry.md`](./sim-racing-telemetry.md) | Sim session/lap lifecycle, visibility & plan gating, lap analytics, InfluxDB tick storage, comparison, coaching, spectating, overlay tokens |
| [`news-external-data.md`](./news-external-data.md) | The `/news` page, the external F1 stats API, the `app/api/[...endpoint]` proxy, free vs. gated content |
| [`glossary.md`](./glossary.md) | Quick disambiguation for easily-confused terms (coins/tokens, the two "F1 session" meanings, the two SignalR hubs, etc.) |

## Quick lookup by keyword

If you're searching for something specific, here's roughly which file has it:

- **Auth / JWT / login** → `frontend-architecture.md` (client flow), `backend-architecture.md` (JWT config)
- **SignalR / WebSocket / live timing / spectate** → `realtime-signalr.md`
- **Prediction / Trivia / Leaderboard / Coins / Tokens / XP / Daily Gift** → `gamification-system.md`
- **Entities / DTOs / enums / PlanType / Role** → `domain-model.md`
- **Controller / endpoint / route table** → `api-reference.md`
- **Sim racing / telemetry laps / InfluxDB / overlay** → `sim-racing-telemetry.md`
- **News page / standings / lap-time distribution / tyre stints** → `news-external-data.md`
- **Cloudflare Worker / F1 proxy** → `realtime-signalr.md` (usage) — worker source itself lives at `docs/cloudflare-worker-f1-proxy.js`
- **Confused about two similar-sounding terms** → `glossary.md`
- **Deployment, CI/CD, versioning, SEO, monitoring** → not here — see the existing files directly under `docs/` (e.g. `docs/COOLIFY_DEPLOYMENT.md`, `docs/VERSIONING.md`, `docs/GITHUB_ACTIONS_INTEGRATION.md`). Note: as of this writing, the Docker build/deploy jobs in `pipeline.yml` are commented out (CI only lints/builds/tests), and some of those docs reference a `.env.example` that doesn't exist (the real template is `.env.production.example`) — worth double-checking against the actual files before trusting specifics.

## Known gaps

A few things this pass could not confirm with full certainty from static reading alone — flagged inline in the relevant file rather than guessed:

- Exact prediction point-scoring formula (partial-credit weighting) — `gamification-system.md`, source: `PredictionService.SettleRaceAsync`.
- Exact "already attempted" exclusion logic for random trivia selection — `gamification-system.md`, source: `TriviaService.GetRandomTriviaAsync`.

If you resolve any of these, update the relevant file directly rather than leaving the caveat stale.
