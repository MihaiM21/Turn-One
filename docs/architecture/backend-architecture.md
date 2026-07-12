# Backend Architecture (`turn-one-backend/`)

> What this covers: the Clean Architecture layer breakdown, startup/DI wiring order, middleware pipeline, config sources, background services, and health checks.

## Layers

```
Domain/          Entities + enums. No external dependencies beyond .NET 9.
Application/     DTOs + service interfaces (IAuthService, IPredictionService, ...). References Domain only. No implementations.
Infrastructure/  EF Core DbContext, migrations, service implementations, background workers.
                 References Domain + Application. Depends on: BCrypt.Net-Next, Npgsql.EntityFrameworkCore.PostgreSQL,
                 InfluxDB.Client, MailKit.
API/             Controllers, SignalR hubs, middleware, startup (Program.cs).
                 References Infrastructure + Application. Depends on: Microsoft.AspNetCore.SignalR, Serilog,
                 InfluxDB.Client, Swashbuckle.
```

Full entity/enum/interface catalog: [`domain-model.md`](./domain-model.md). Full endpoint catalog: [`api-reference.md`](./api-reference.md).

## Startup wiring (`Program.cs`)

### Logging (Serilog)

- Minimum level Information; `Microsoft.*` overridden to Warning.
- Enrichers: `LogContext`, thread ID, `Application = "TurnOne-API"`.
- Sinks: console (structured) + daily rolling file, 30-day retention, `logs/turnone-.log`.

### Configuration sources (in order)

1. `appsettings.json`
2. Environment variables (`builder.Configuration.AddEnvironmentVariables()`)
3. Explicit overrides mapped from env vars:
   - `APP_BASE_URL` → `AppSettings:BaseUrl`
   - `DATABASE_URL` → `ConnectionStrings:DefaultConnection`
   - `F1_LIVETIMING_URL` → `F1:LiveTimingUrl`
   - `JWT__Key` → `JWT:Key`
   - `SmtpSettings__Username` / `SmtpSettings__Password` → `SmtpSettings:*`

### DI registration order

1. Controllers, OpenAPI, SignalR
2. Swagger + JWT security scheme
3. CORS (two named policies — one for REST, one for SignalR, see below)
4. `DbContext` (Npgsql/PostgreSQL)
5. Health checks (database probe)
6. Core services: `IAuthService`, `IUserService`, `ISubscriptionService`, `IAdminService`, `IPageStatusService`, `IVersionService` (singleton)
7. Gamification services: `ICoinService`, `ITokenService`, `IPredictionService`, `ITriviaService`, `ILeaderboardService`, `INotificationService`, `IExportPresetService`
8. Email: `IEmailService` (factory-registered, SMTP-configured)
9. F1 integration: `F1LiveTimingService` (singleton), `F1WebSocketService` (singleton)
10. Background services: `TokenRefillBackgroundService` (hosted)
11. Telemetry: `ITelemetrySessionService`, `ILapAnalyticsService`, `IOverlayTokenService`, `ICoachingService` (either `HeuristicCoachingService` or `StubLlmCoachingService`, provider-selected), `ITelemetryTickRepository` (InfluxDB-backed), `TelemetryIngestionService` (singleton), an unbounded `Channel<TickItem>`, `TelemetryPersistenceWorker` (hosted), `TelemetrySweeperWorker` (hosted)
12. HTTP client factory

### Auth

JWT Bearer scheme. `TokenValidationParameters`: `ValidateIssuerSigningKey = true`, `ValidateIssuer`/`ValidateAudience` = `!IsDevelopment` (relaxed locally, enforced in prod), `ValidateLifetime = true`, `ClockSkew = TimeSpan.Zero`. `OnMessageReceived` pulls the token from the query string for SignalR connections under `/hubs`, `/api/hubs`, `/api/ws` (SignalR JS client can't set headers on the WS handshake). Accepts tokens with or without a `Bearer` prefix.

### CORS

Two policies — one for normal REST, one (`SignalRCorsPolicy`) for the hubs. Allowed origins come from `CORS_ALLOWED_ORIGINS` or default to `localhost:3000`/`:3001` (dev) plus the production domains (`t1f1.com`, `turnonehub.com` and `www.`/`dev.` variants). Exposes `Authorization` and `X-F1-Cookies` headers; credentials allowed.

### Middleware pipeline order

1. Swagger (dev only)
2. HSTS (prod only)
3. `SecurityHeadersMiddleware` (prod only)
4. CORS
5. Static files
6. `RequestLoggingMiddleware`
7. Authentication
8. Authorization
9. `WebSocketOptions` (2-minute keep-alive)
10. `TelemetryWebSocketMiddleware` (custom WS handler for telemetry ingestion)
11. `WebSocketMiddleware` (generic WS handler)
12. Routing (controllers + SignalR hub maps)

### SignalR hub routes

- `F1LiveDataHub` → `/hubs/f1livedata`
- `SimTelemetryHub` → `/api/hubs/simtelemetry`

Both under the `SignalRCorsPolicy`. Full event/method breakdown: [`realtime-signalr.md`](./realtime-signalr.md).

### Database init on startup

- Migrations auto-applied via `db.Database.Migrate()`.
- Seed data (idempotent): an admin user `mihai@t1f1.com` (Role=ADMIN, Plan=ELITE) if not present, and `TriviaSeeder.SeedTriviaQuestions(db)`.

## Background services

| Service | Cadence | Purpose |
|---|---|---|
| `TokenRefillBackgroundService` | Hourly | Refills `User.Tokens` for users whose `LastTokenRefillDate` is 30+ days old (per plan allotment), and processes plan auto-renewal. |
| `TelemetryPersistenceWorker` | Continuous (channel consumer) | Drains the `Channel<TickItem>` and persists sim telemetry ticks to InfluxDB. |
| `TelemetrySweeperWorker` | Periodic | Closes stale `TelemetrySession`s whose `LastSeenAt` is past a cutoff (client disconnected without a clean end). |

## Health checks

`HealthController` exposes:

- `GET /health` — overall status (DB reachability + memory + uptime)
- `GET /health/ready` — readiness probe (DB connectivity)
- `GET /health/live` — liveness probe
- `GET /health/metrics` — process metrics (memory, CPU, GC)

## Database

PostgreSQL in production (Npgsql EF Core provider), SQLite as a dev fallback. Connection string resolved from `DATABASE_URL`. See [`domain-model.md`](./domain-model.md) for the full `DbSet` list and indexing, and `docs/DATABASE_MIGRATION_GUIDE.md` (existing, still accurate) for the migration workflow itself.
