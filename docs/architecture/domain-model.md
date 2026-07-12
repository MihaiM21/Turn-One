# Domain Model

> What this covers: every backend entity and enum (`turn-one-backend/Domain/`), the plan/feature table, and how frontend types (`turn-one-client/types/`) map onto them.

## Entities

All under `turn-one-backend/Domain/Entities/` unless noted.

| Entity | Key fields | Notes |
|---|---|---|
| **User** | `Id`, `Email`, `Username`, `Password` (BCrypt hash), `AvatarUrl`, `Role`, `Coins`, `Level`, `Experience`, `Plan`, `PlanStartDate`, `PlanEndDate`, `AutoRenew`, `Tokens`, `LastTokenRefillDate`, `LastDailyGiftDate`, `HasClaimedStarterPack`, email-confirmation/password-reset tokens + expiries, `CreatedAt`, `LastLogin` | Central account entity — carries both gamification state (coins/level/XP) and subscription state (plan/tokens) directly. |
| **Prediction** | `Id`, `UserId`, `RaceId`, `RaceName`, `Season`, `PodiumP1/P2/P3`, `FastestLapDriver`, `PolePositionDriver`, `FirstRetirementLap`, `WillThereBeASafetyCar`, `NumberOfDnfs`, `CoinsWagered`, `PotentialPayout`, `Status` (`PredictionStatus`), `PointsEarned`, `CoinsEarned`, `CreatedAt`, `SettledAt`, `RaceDateTime` | See [`gamification-system.md`](./gamification-system.md) for settlement flow. |
| **Trivia** | `Id`, `Question`, `OptionA/B/C/D`, `CorrectAnswer`, `Category`, `Difficulty`, `CoinsReward`, `ExperienceReward`, `IsActive`, `CreatedAt`, `LastModifiedAt`; has many `TriviaAttempt` | |
| **TriviaAttempt** | `Id`, `UserId`, `TriviaId`, `SelectedAnswer`, `IsCorrect`, `CoinsEarned`, `ExperienceEarned`, `AttemptedAt` | Audit record of every answer submitted. |
| **Leaderboard** | `Id`, `UserId`, `TotalPredictions`, `CorrectPredictions`, `TotalPointsEarned`, `TotalCoinsEarned`, `CurrentStreak`, `LongestStreak`, `GlobalRank`, `SeasonRank`, `Season`, `TriviaCorrect`, `TriviaAttempts`, `LastUpdated` | Denormalized ranking snapshot, recomputed via `UpdateLeaderboardAsync`. |
| **CoinTransaction** | `Id`, `UserId`, `Amount` (signed), `Type` (`CoinTransactionType`), `Description`, optional `PredictionId`/`TriviaAttemptId`, `CreatedAt` | Every coin add/deduct is audited here — this is the ledger, `User.Coins` is the running balance. |
| **SimUser** | `Id`, `UserId` (1:1), `TotalSessions`, `TotalLaps`, `TotalDistanceKm`, `TotalPlayTimeSeconds`, `HighestSpeedKmh`, `LastSessionAt` | Aggregate sim-racing stats per user. |
| **TelemetrySession** | `Id`, `UserId`, `CarModel`, `Track`, `DriverName`, `SessionType`, `Mode` (`TelemetryMode`), `Visibility` (`TelemetryVisibility`), `Status` (`TelemetrySessionStatus`), `IsActive`, `LapCount`, `BestLapMs`, `ClientVersion`, `StartedAt`, `EndedAt`, `LastSeenAt`; has many `TelemetryLap` | See [`sim-racing-telemetry.md`](./sim-racing-telemetry.md). |
| **TelemetryLap** | `Id`, `SessionId` (cascade delete), `LapNumber`, `LapTimeMs`, `Sector1/2/3Ms`, `IsValid`, `MaxSpeedKmh`, `MaxRpm`, `AverageThrottle`, `AverageBrake`, `FuelUsed`, nullable `BrakingScore`/`ThrottleScore`/`ConsistencyScore`, `RecordedAt` | Unique composite index on `(SessionId, LapNumber)`. Scores are computed by `ILapAnalyticsService`, not always populated. |
| **OverlayShareToken** | `Id`, `UserId` (cascade delete), `Token` (unique), `Label`, `Scopes` (comma-separated: `cockpit`, `lap`, `leaderboard`), `CreatedAt`, `ExpiresAt`, `RevokedAt` | Backs `/overlay/[token]/...` streaming overlay routes. |
| **Notification** | `Id`, `Title`, `Message`, `Type` (INFO/SUCCESS/WARNING/ERROR), `TargetAudience` (ALL/PLAN/ROLE), `TargetPlans`, `TargetRoles`, `CreatedById`, `IsActive`, `CreatedAt`; has many `UserNotification` | Admin-authored broadcast notifications. |
| **UserNotification** | `Id`, `UserId`, `NotificationId`, `IsRead`, `ReadAt`, `ReceivedAt` | Per-user delivery/read-state record. |
| **PageStatus** | `Id`, `PageSlug` (unique), `IsDisabled`, `MaintenanceMessage`, `UpdatedAt`, `UpdatedByUsername` | Backs the frontend's `usePageMaintenance(slug)` maintenance-mode gate. |
| **Media** | `Id`, `FileName` (unique index), `OriginalFileName`, `AltText`, `FilePath`, `FileType`, `FileSize`, `UploadedAt`, `UploadedByUserId` | Admin-uploaded media/images. |
| **ExportPreset** | `Id`, `Name`, `SessionType` (indexed), `ChartKeys` (JSON), `OutputSizes` (JSON), `CreatedAt`, `UpdatedAt`, `CreatedByUserId` | Saved chart-export configurations, admin-managed (`admin/export-graphs/`). |
| **ApiWishlist** | `Id`, `Email` (unique), `SubscribedAt`, `IsNotified`, `IpAddress` | Waitlist signups for a not-yet-launched public API. |
| **Version** | Single-row entity | Backs the app version display (see `VersionProvider` on the frontend). |

## Enums

| Enum | Values | Where used |
|---|---|---|
| `Role` | `USER`, `CONTENT_CREATOR`, `ADMIN` | Auth claims, `[Authorize(Roles=...)]` |
| `PlanType` | `BASIC`, `PRO`, `ELITE` | Subscription tier; gates telemetry/spectate features |
| `PredictionStatus` | `PENDING`, `WON`, `LOST`, `PARTIAL`, `CANCELLED` | Prediction lifecycle |
| `CoinTransactionType` | `DAILY_GIFT`, `PREDICTION_WAGER`, `PREDICTION_WIN`, `TRIVIA_REWARD`, `LEVEL_UP_BONUS`, `ACHIEVEMENT_REWARD`, `ADMIN_ADJUSTMENT`, `PURCHASE`, `REFUND` | Coin ledger entries |
| `TelemetryMode` | `Normal`, `ExtremeLive` | `TelemetrySession.Mode` |
| `TelemetryVisibility` | `Private`, `Public` | `TelemetrySession.Visibility` — public sessions require PRO/ELITE |
| `TelemetrySessionStatus` | `Active`, `Paused`, `Ended` | `TelemetrySession.Status` |
| `SessionType` | `PRACTICE`, `QUALIFYING`, `RACE` | `TelemetrySession.SessionType` |

## Plan features (`Domain/PlanFeatures.cs`)

`PlanDetails` is a static config table:

| Plan | Monthly tokens | Price | Token purchase discount |
|---|---|---|---|
| BASIC | 30 | $0 | 0% |
| PRO | 100 | $9.99 | 10% |
| ELITE | 250 | $19.99 | 25% |

## Frontend ↔ backend type mapping

Frontend types live in `turn-one-client/types/*-types.ts` and largely mirror backend DTOs (not entities directly — DTOs shape what's actually sent over the wire).

| Frontend type file | Mirrors backend concept |
|---|---|
| `auth-types.ts` (`AuthResponse`, `LoginData`, `RegisterData`) | `AuthResponseDto`, `LoginDto`, `RegisterDto` |
| `user-types.ts` (`UserProfile`, `TokenStatus`) | `User` entity (subset) + `ISubscriptionService.GetTokenStatusAsync` return shape |
| `game-types.ts` (`Prediction`, `LeaderboardEntry`, `UserStats`, `PredictionStatus`, `CoinTransactionType` enums) | `PredictionDto`, `LeaderboardDto`, `UserStatsDto` — enum names/values match the backend enums exactly |
| `news-types.ts` (`SessionDashboardData`, `DriverStanding`, `LapTimeDistributionPoint`, `TyreStintEntry`) | **Not** backend DTOs — these model the shape returned by the external F1 stats API, proxied through `app/api/[...endpoint]/route.ts`. See [`news-external-data.md`](./news-external-data.md). |
| Sim types (`SimPhysics`, `SimGraphics`) | Shape of `ReceiveTelemetry` payloads from `SimTelemetryHub`, not a 1:1 DTO — see [`realtime-signalr.md`](./realtime-signalr.md). |

Full endpoint-level detail (which DTO each controller action takes/returns): [`api-reference.md`](./api-reference.md).
