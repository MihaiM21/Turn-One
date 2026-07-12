# Glossary

> What this covers: short disambiguation entries for terms that are easy to confuse in this codebase. If you're not sure which of two similar-sounding things a piece of code refers to, check here first.

**Coins vs. Tokens**
Coins are free, earned in-game currency (predictions, trivia, daily gifts) with every change audited in `CoinTransaction`. Tokens are a plan-based premium currency that unlocks premium sim-telemetry features, refilled monthly per subscription tier, purchasable with coins. See [`gamification-system.md`](./gamification-system.md#coins-vs-tokens--dont-conflate-these).

**Prediction vs. Trivia**
Both are gamification mini-games, but structurally different: a Prediction is a multi-field wager on a real F1 race's outcome, settled once (by an admin) after the race happens. Trivia is a single multiple-choice question, answered and scored instantly. See [`gamification-system.md`](./gamification-system.md).

**F1 live-timing feed vs. F1 stats API (news)**
Two unrelated upstream data sources. Live timing is the official F1 live-timing WebSocket feed (via a Cloudflare Worker proxy → `F1LiveTimingService` → `F1LiveDataHub` → SignalR), used for real-time dashboards. The "stats API" is a separate third-party REST API used only by the `/news` page and dashboard session-highlights widget, reached through the Next.js `app/api/[...endpoint]/route.ts` proxy. See [`realtime-signalr.md`](./realtime-signalr.md) and [`news-external-data.md`](./news-external-data.md).

**TelemetrySession (sim racing) vs. F1 session (real race weekend)**
A `TelemetrySession` entity is one user's sim-racing run (practice/race in a sim title), tracked with laps, analytics, visibility. An "F1 session" in the news/live-timing context (e.g. `session_type: "qualifying" | "race" | "practice"`) refers to a real Formula 1 race-weekend session — unrelated entities, just an overloaded word. See [`sim-racing-telemetry.md`](./sim-racing-telemetry.md) vs. [`news-external-data.md`](./news-external-data.md).

**Plan vs. Role**
`PlanType` (`BASIC` / `PRO` / `ELITE`) is a subscription tier controlling feature access (tokens, telemetry gating). `Role` (`USER` / `CONTENT_CREATOR` / `ADMIN`) is an authorization level controlling which API endpoints/admin UI a user can reach. A user has exactly one of each, independently. See [`domain-model.md`](./domain-model.md).

**F1LiveDataHub vs. SimTelemetryHub**
Two separate SignalR hubs. `F1LiveDataHub` streams the external F1 live-timing feed to all connected clients (currently no `[Authorize]`). `SimTelemetryHub` streams a specific user's own sim-racing telemetry, or lets others spectate a specific session (`[Authorize]` required). See [`realtime-signalr.md`](./realtime-signalr.md).
