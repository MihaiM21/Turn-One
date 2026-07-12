# Frontend Architecture (`turn-one-client/`)

> What this covers: App Router route groups and what lives in each, the auth flow, the three data-fetching patterns and when to use each, naming/folder conventions, and state management approach.

## Route groups

Next.js 15 App Router, organized into route groups for layout isolation:

| Route group | Access | Contents |
|---|---|---|
| `app/(site)/` | Public | `home/` landing page, `news/` (F1 session analysis, free + gated telemetry teaser), `pricing/`, `features/`, `examples/`, `api-launch/`, `contact/`, `privacy/`, `terms/`, `cookies/` |
| `app/(dashboard)/` | Protected (authenticated users) | Dashboard hub, game hub (predictions/trivia/leaderboard), store, sim racing, live dashboards, account/settings, admin |
| `app/auth/` | Public | `login/`, `signup/`, `forgot-password/`, `reset-password/`, `confirm-email/`, `check-email/` |
| `app/api/` | Server-side route handlers | `[...endpoint]/route.ts` (external F1 API proxy), `health/route.ts` |
| `app/overlay/` | Public, token-scoped (no user auth) | `[token]/lap/`, `[token]/leaderboard/`, `[token]/cockpit/` — streaming overlays for OBS |

### Inside `(dashboard)/`

- `dashboard/page.tsx` — main entry: welcome banner, daily gift, latest session highlights, standings.
- `(game-hub)/hub/` — central games hub; `games/page.tsx` is a tab-based UI (Predict / My Predictions / Trivia / Leaderboard / Stats). `predictions/page.tsx` just redirects to `/games?tab=my-predictions`.
- `(game-hub)/store/` — coin store, buy tokens.
- `rewards/page.tsx` — level progression, daily gift status, coin/XP display.
- `simracing/` — sessions list/detail/compare, leaderboards, live telemetry, coach, spectate, streamer views.
- `live/`, `live2/` — live F1 data dashboards.
- `generator/` — telemetry data generator (test/demo tool).
- `admin/` — admin-only: `predictions/`, `trivia/`, `media/`, `notifications/`, `export-graphs/`. Gated by a `checkAdminAccess()` call, not by `middleware.ts`.
- `notifications/`, `settings/`, `account/` — user-facing utility pages.

## Auth flow

Files: `lib/auth.ts`, `lib/auth-utils.ts`, `middleware.ts`.

1. **Login/Register** (`lib/auth.ts`): `login(data)` POSTs to `/Auth/login`, `register(data)` POSTs to `/Auth/register` and auto-logs-in on success. Both return an `AuthResponse` containing the JWT.
2. **Token storage**: JWT is stored in `localStorage` under key `'token'` (`lib/auth-utils.ts`: `getAuthToken()`, `setAuthToken()`, `removeAuthToken()`, `isAuthenticated()`). All accessors guard on `typeof window` since this is client-only.
3. **Current user**: `getCurrentUser()` fetches the profile using the stored token. The `useAuth()` hook wraps this — loads user on mount, exposes `loginUser()`, `registerUser()`, `logout()`, `isAuthenticated`.
4. **Route protection**: `middleware.ts` currently only **logs** admin route access attempts — it does not enforce redirects server-side. Enforcement is client-side: components check `getAuthToken()`/`isAuthenticated()` and redirect to `/auth/login` themselves. Keep this in mind if you're auditing security — the real gate for protected pages is in the page/component code, not the middleware.

Related services: `lib/userService.ts` (profile, preferences), `lib/tokenService.ts` (token balance, purchases).

## Data-fetching patterns

There are three distinct patterns in this codebase — don't mix them up:

### A. `lib/data-fetcher.ts` — authenticated calls to Turn One's own backend

```ts
fetchWithAuth<T>(endpoint: string, options?: RequestInit): Promise<T>
```

- Adds `Authorization: Bearer <token>` automatically.
- Base URL: `NEXT_PUBLIC_BACKEND_URL`.
- Used by `userService`, `gameService`, `levelSystemService`, etc. — i.e. anything hitting the ASP.NET Core API directly.
- Has a structured `ExternalApiError` class that preserves HTTP status + error code, distinguishing a transient "data not ready" (503, code `data_not_available`) from a genuine failure so callers can retry intelligently.

### B. `lib/newsService.ts` — external F1 stats data, via the Next.js proxy

Fetches telemetry/standings through `app/api/[...endpoint]/route.ts` rather than calling the ASP.NET backend. Key functions: `getLatestSessionData()`, `getSeasonStandings()`, `getLapTimeDistribution(...)`, `getTyreStintData(...)`, `getNewsPageData()` (aggregator using `Promise.allSettled`, resilient to partial failures). See [`news-external-data.md`](./news-external-data.md) for the full picture.

### C. `lib/auth.ts` — direct fetch, login/register only

A minimal, un-wrapped `fetch` straight to the backend's `Auth` endpoints (no token to attach yet, since this *produces* the token).

## Real-time hooks

See [`realtime-signalr.md`](./realtime-signalr.md) for the full hub/event breakdown. Client entry points:

- `lib/f1SignalRLiveDataService.ts` + `hooks/use-f1-signalr-live-data.ts` — F1 live timing.
- `lib/simTelemetryService.ts` + `hooks/use-overlay-telemetry.ts` — sim racing telemetry, spectating, overlays.

## Naming & folder conventions

| Kind | Convention | Example |
|---|---|---|
| Hooks | `use-kebab-case.ts` | `use-f1-signalr-live-data.ts`, `use-tokens.ts` |
| Services | `camelCaseService.ts` | `gameService.ts`, `newsService.ts`, `adminService.ts` |
| Components | PascalCase folders + files | `dashboard/games/prediction-game.tsx` |
| Types | `kebab-case-types.ts` | `auth-types.ts`, `game-types.ts`, `news-types.ts` |

Folders: `components/ui/` = Radix/shadcn primitives; `components/site/` = marketing site pieces; `components/dashboard/` = feature UI grouped by domain (games, simracing, store, live); `components/providers/` = Context providers; `lib/constants/` = static data (drivers, races, season fixtures, store items, mocks); `lib/export/` = chart export utilities.

## State management

No Redux/Zustand — **Context API + hooks** only:

- `PageLoadingProvider` — global loading overlay.
- Local component state (`useState`) for feature-level data.
- A lightweight custom event bus: `useBalanceRefresh(callback)` listens for a `'turn-one:balance-changed'` `window` event, dispatched after coin transactions, to refetch balances without prop drilling.
- Notable reusable hooks: `useToast()` (Sonner), `useUser()`, `usePageMaintenance(slug)` (renders a `MaintenanceScreen` if an admin has disabled that page — see `PageStatus` in [`domain-model.md`](./domain-model.md)).

## Key domain types

See [`domain-model.md`](./domain-model.md) for the cross-referenced frontend/backend type mapping (auth, user profile, games/predictions, F1 session/telemetry, sim telemetry).
