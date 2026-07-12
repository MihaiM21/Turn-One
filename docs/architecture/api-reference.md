# API Reference

> What this covers: every controller in `turn-one-backend/API/Controllers/`, its routes, HTTP verbs, and auth requirements. For request/response DTO shapes, cross-reference [`domain-model.md`](./domain-model.md) and the interfaces in `Application/Interfaces/`. For live/swagger docs, run the API and visit `/swagger` in development.

Auth column key: **Auth** = any authenticated user (`[Authorize]`), **Admin** = `[Authorize(Roles="ADMIN")]`, **Anon** = `[AllowAnonymous]`, **Plan** = additionally gated by `PlanType` claim (PRO/ELITE).

## AuthController — `api/auth`

| Route | Verb | Auth | Purpose |
|---|---|---|---|
| `/register` | POST | Anon | Create account |
| `/login` | POST | Anon | Issue JWT |
| `/me` | GET | Auth | Current user profile (includes `canClaimDailyGift`) |
| `/confirm-email?token=...` | GET | Anon | Verify email |
| `/forgot-password` | POST | Anon | Request password reset |
| `/reset-password` | POST | Anon | Execute password reset |

## UserController — `api/user`

CRUD for the user's own profile. (Exact route table not exhaustively enumerated in research — see `Application/Interfaces/IUserService.cs` and the controller file directly.)

## PredictionController — `api/prediction` (base: Auth)

| Route | Verb | Auth | Purpose |
|---|---|---|---|
| `/` | POST | Auth | Create a race prediction |
| `/user` | GET | Auth | Get caller's predictions |
| `/pending` | GET | Auth | Get caller's pending predictions |
| `/{id}` | GET | Auth | Get one prediction |
| `/{id}/settle` | POST | Admin | Settle a single prediction |
| `/all/pending` | GET | Admin | All pending predictions, any user |
| `/races/pending` | GET | Admin | Unique race IDs with pending predictions |
| `/race/{raceId}/validate` | POST | Admin | Settle **all** predictions for a race against actual results |

## TriviaController — `api/trivia` (base: Auth)

| Route | Verb | Auth | Purpose |
|---|---|---|---|
| `/random` | GET | Auth | Get a random trivia question for the caller |
| `/attempt` | POST | Auth | Submit an answer |
| `/all` | GET | Admin | List all trivia |
| `/` | POST | Admin | Create trivia |
| `/{id}` | PUT | Admin | Update trivia (clears related user attempts) |
| `/{id}` | DELETE | Admin | Delete trivia |

## CoinController — `api/coin` (base: Auth)

| Route | Verb | Purpose |
|---|---|---|
| `/balance` | GET | Coin balance |
| `/transactions?limit=50` | GET | Transaction history |

## TokenController — `api/token` (base: Auth)

| Route | Verb | Purpose |
|---|---|---|
| `/purchase` | POST | Buy tokens with coins |
| `/balance` | GET | Token balance |
| `/claim-starter-pack` | POST | Claim one-time starter pack (500 coins + 50 tokens) |
| `/starter-pack-status` | GET | Whether starter pack already claimed |

## DailyGiftController — `api/dailygift` (base: Auth)

| Route | Verb | Purpose |
|---|---|---|
| `/status` | GET | Can caller claim today's gift |
| `/claim` | POST | Claim it |

## LeaderboardController — `api/leaderboard` (base: Auth)

| Route | Verb | Purpose |
|---|---|---|
| `/global?limit=100` | GET | Global leaderboard |
| `/season/{season}?limit=100` | GET | Season leaderboard |
| `/predictions?limit=100` | GET | Predictions-accuracy leaderboard |
| `/coins?limit=100` | GET | Coins leaderboard |
| `/level?limit=100` | GET | Level leaderboard |
| `/stats` | GET | Caller's personal stats |

## LevelSystemController — `api/levelsystem` (base: Auth)

| Route | Verb | Purpose |
|---|---|---|
| `/progress` | GET | Current level/XP |
| `/add-experience` | POST | Add XP (test/debug endpoint) |

## NotificationController — `api/notification` (base: Auth)

| Route | Verb | Auth | Purpose |
|---|---|---|---|
| `?limit=50` | GET | Auth | Caller's notifications |
| `/stats` | GET | Auth | Unread count etc. |
| `/{notificationId}/read` | POST | Auth | Mark one read |
| `/read-all` | POST | Auth | Mark all read |
| `/all` | GET | Admin | All notifications |
| `/` | POST | Admin | Create + send a notification |
| `/{id}` | DELETE | Admin | Delete a notification |

## SubscriptionController — `api/subscription` (base: Auth)

| Route | Verb | Purpose |
|---|---|---|
| `/upgrade` | POST | Upgrade plan |
| `/downgrade` | POST | Downgrade plan |
| `/refill` | POST | Manually refill tokens |
| `/token-status` | GET | Tokens remaining, days until refill |
| `/purchase-tokens` | POST | Buy tokens |
| `/consume-token` | POST | Consume 1 token |
| `/consume-tokens` | POST | Consume N tokens |

## AdminController — `api/admin` (base: Admin)

| Route | Verb | Purpose |
|---|---|---|
| `/users` | GET | All users |
| `/users/{userId}` | GET | One user |
| `/users/{userId}/plan` | PUT | Change plan |
| `/users/{userId}/role` | PUT | Change role |
| `/users/{userId}/tokens` | PUT | Set token balance |

## TelemetryController — `api/telemetry` (base: Auth)

| Route | Verb | Auth | Purpose |
|---|---|---|---|
| `/me/stats` | GET | Auth | Caller's sim stats (sessions, laps, distance, best lap) |
| `/sessions/me` | GET | Auth | Caller's telemetry sessions |
| `/leaderboards?limit=50` | GET | Anon | Sim driver leaderboard |
| `/sessions/public` | GET | Plan (PRO/ELITE) | Public sessions |
| `/live` | GET | Plan (PRO/ELITE) | Live sessions available to spectate |
| `/sessions/{id}` | GET | Auth | Session detail |
| `/sessions/{id}/chart` | GET | Plan for paid channels | Physics telemetry chart data |
| `/sessions/{id}/channels?channels=...` | GET | Auth | Specific telemetry channels |
| `/sessions/{id}/laps/{lapNumber}/chart?channels=...` | GET | Auth | Lap-specific chart |
| `/sessions/{id}/laps` | GET | Auth | All laps in session |
| `/sessions/{id}/metrics` | GET | Plan (PRO/ELITE) | Lap analytics (braking/throttle/consistency scores) |
| `/sessions/{id}/compare?against=&lap=&againstLap=&channels=` | GET | Plan (PRO/ELITE) | Compare two sessions |
| `/sessions/{id}/visibility` | PATCH | Auth (Plan for setting Public) | Set session visibility |
| `/sessions/{id}` | DELETE | Auth | Delete session |

See [`sim-racing-telemetry.md`](./sim-racing-telemetry.md) for what these fields mean.

## CoachingController — `api/coaching`

LLM/heuristic-based lap coaching feedback (`ICoachingService` — `HeuristicCoachingService` or `StubLlmCoachingService`).

## OverlayController — `api/overlay`

Overlay share-token CRUD (create/revoke tokens backing `/overlay/[token]/...` routes).

## F1LiveTimingController — `api/f1livetiming`

| Route | Verb | Purpose |
|---|---|---|
| `/negotiate` | GET | Proxy F1 live-timing SignalR negotiation |
| `/status` | GET | Check F1 live-timing service availability |
| `/negotiate` | OPTIONS | CORS preflight |

## F1LiveDataController — `api/f1livedata`

F1 live data streaming support endpoints (paired with `F1LiveDataHub` — see [`realtime-signalr.md`](./realtime-signalr.md)).

## Other controllers

| Controller | Route | Purpose |
|---|---|---|
| `ImageController` | `api/image` | Media/image upload + serve |
| `ContactController` | `api/contact` | Contact form submission |
| `ApiWishlistController` | `api/apiwishlist` | Public API waitlist signup |
| `ExportPresetsController` | `api/exportpresets` | Chart export preset CRUD (admin) |

## HealthController — `/health`

| Route | Verb | Purpose |
|---|---|---|
| `/` | GET | Overall health (DB + memory + uptime) |
| `/ready` | GET | Readiness probe |
| `/live` | GET | Liveness probe |
| `/metrics` | GET | Process metrics (memory, CPU, GC) |
