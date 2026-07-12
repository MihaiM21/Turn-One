# Gamification System

> What this covers: predictions, trivia, leaderboards, the coins-vs-tokens distinction, the level/XP system, daily gifts, and subscription plans — the rules and where the logic lives.

## Predictions

Users wager coins on F1 race outcomes. A `Prediction` (see [`domain-model.md`](./domain-model.md)) captures podium picks (`PodiumP1/P2/P3`), `FastestLapDriver`, `PolePositionDriver`, `FirstRetirementLap`, `WillThereBeASafetyCar`, `NumberOfDnfs`, plus `CoinsWagered`/`PotentialPayout`.

**Creation**: `POST /api/prediction` (`PredictionController` → `IPredictionService.CreatePredictionAsync`) — frontend entry point is `components/dashboard/games/prediction-game.tsx` via `predictionService.createPrediction()`.

**Settlement**: An admin submits actual results via `POST /api/prediction/race/{raceId}/validate` with a `RaceResultsDto`. `IPredictionService.SettleRaceAsync` loops every pending prediction for that race, compares predicted vs. actual, and sets `Status` to `WON` / `LOST` / `PARTIAL`, then awards `PointsEarned`/`CoinsEarned` and records a `CoinTransaction` (`PREDICTION_WIN` or similar). **The exact point-scoring formula (how partial credit is weighted per correct field) was not confirmed during research — read `PredictionService.SettleRaceAsync` in `Infrastructure/Services/` directly before relying on the specifics.**

A single prediction can also be settled individually via `POST /api/prediction/{id}/settle`.

Status lifecycle: `PENDING → WON | LOST | PARTIAL` (or `CANCELLED`). Frontend polls `getPendingPredictions()` / `getUserPredictions()` / `getPredictionById(id)`.

## Trivia

`Trivia` questions have 4 options (`OptionA-D`), a `CorrectAnswer`, `CoinsReward`, `ExperienceReward`, `Category`, `Difficulty`.

**Flow**: `GET /api/trivia/random` returns one active question the caller can answer; `POST /api/trivia/attempt` submits a `TriviaAttemptDto { TriviaId, SelectedAnswer }`. `ITriviaService.SubmitTriviaAttemptAsync` validates the answer, records a `TriviaAttempt`, and — if correct — awards `Trivia.CoinsReward` (via `ICoinService`, transaction type `TRIVIA_REWARD`) and `Trivia.ExperienceReward` (via `ILevelSystemService.AddExperienceAsync`). **The exact "already attempted this question" exclusion logic for `GetRandomTriviaAsync` was not confirmed — check `TriviaService.GetRandomTriviaAsync` directly.**

Admin CRUD: `POST /api/trivia`, `PUT /api/trivia/{id}` (updating a question clears related user attempts), `DELETE /api/trivia/{id}`.

Frontend: `components/dashboard/games/trivia-game.tsx`.

## Leaderboards

Five variants, all reading from the `Leaderboard` entity or computed on the fly:

| Endpoint | What it ranks |
|---|---|
| `GET /api/leaderboard/global` | All-time total points |
| `GET /api/leaderboard/season/{season}` | Points within a season |
| `GET /api/leaderboard/predictions` | Prediction accuracy |
| `GET /api/leaderboard/coins` | Coin balance |
| `GET /api/leaderboard/level` | User level |

`ILeaderboardService.UpdateLeaderboardAsync(userId)` recomputes a user's `Leaderboard` row — called after events that change ranking-relevant stats (prediction settlement, level-up, trivia correct, etc.). `GetUserStatsAsync(userId)` aggregates a personal stats view (`UserStatsDto`) shown on `components/dashboard/games/user-stats-card.tsx`.

## Coins vs. Tokens — don't conflate these

This is the single easiest thing to get wrong in this codebase (see also [`glossary.md`](./glossary.md)):

- **Coins** — free, earned in-game currency. Every change is audited in `CoinTransaction` (ledger), with `User.Coins` as the running balance. Earned via daily gifts, prediction wins, trivia correct answers, achievements; spent on wagers and the token store. `ICoinService.AddCoinsAsync`/`DeductCoinsAsync` always write a `CoinTransaction`.
- **Tokens** — plan-based premium currency, used to unlock premium telemetry features (see `TelemetryController` plan gates). `User.Tokens`, refilled monthly per plan tier (`PlanDetails`: BASIC 30, PRO 100, ELITE 250) by `TokenRefillBackgroundService` (hourly check against `User.LastTokenRefillDate`, 30-day cadence). Tokens can also be bought with coins (`POST /api/token/purchase`), with a plan-based discount (PRO 10%, ELITE 25%). New users can claim a one-time starter pack (`POST /api/token/claim-starter-pack` → 500 coins + 50 tokens, gated by `User.HasClaimedStarterPack`).

## Level & XP

- `User.Level` and `User.Experience`.
- XP required for the next level: `100 × currentLevel + 100` (`ILevelSystemService.CalculateExperienceRequiredForNextLevel`).
- `AddExperienceAsync(userId, amount)` adds XP, then loops leveling the user up (incrementing `Level`, resetting/rolling over `Experience`) until the remaining XP is below the next threshold. Returns the number of levels gained in one call (can be 0, 1, or more).
- XP sources: trivia correct answers, daily gift claim, prediction wins (implied by `LEVEL_UP_BONUS`/`ACHIEVEMENT_REWARD` transaction types existing — confirm exact trigger points in `LevelSystemService` if precision matters).
- `GET /api/levelsystem/progress` returns `{ currentLevel, currentExperience, experienceRequired, progressPercentage }` — shown on the rewards page and dashboard.

## Daily Gift

`IDailyGiftService.ClaimDailyGiftAsync` — one claim per UTC calendar day, gated by `User.LastDailyGiftDate`. Fixed reward (50 coins + 25 XP per the frontend's documented expectation; verify current values in `DailyGiftService` if they've changed). `GET /api/dailygift/status` → `{ canClaimDailyGift }`; `POST /api/dailygift/claim` → `{ success, message, coins, experience }`. Frontend: `DailyGiftWidget` on the dashboard and rewards page.

## Subscription plans

`PlanType`: `BASIC` / `PRO` / `ELITE`. See [`domain-model.md`](./domain-model.md) for the token/price/discount table. Plan gates:

- Telemetry: public session browsing, spectating, session comparison, and some chart channels require PRO/ELITE (`TelemetryController`).
- Token refill rate and purchase discount scale with plan.

`ISubscriptionService` handles `UpgradePlanAsync`/`DowngradePlanAsync`, `RefillTokensAsync`, `GetTokenStatusAsync`, `PurchaseTokensAsync`, `ConsumeTokensAsync`, `CheckAndRenewPlanAsync` (auto-renewal check). Exposed via `SubscriptionController` (`api/subscription`).
