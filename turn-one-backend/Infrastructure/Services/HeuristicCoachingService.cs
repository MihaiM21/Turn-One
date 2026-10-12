using Application.Interfaces;
using Application.Telemetry;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class HeuristicCoachingService : ICoachingService
{
    private readonly TurnOneDbContext _context;
    private readonly ILapAnalyticsService _analytics;

    public HeuristicCoachingService(TurnOneDbContext context, ILapAnalyticsService analytics)
    {
        _context = context;
        _analytics = analytics;
    }

    public async Task<List<CoachingTip>> GenerateTipsAsync(PlanType plan, Guid sessionId, int? lapNumber = null)
    {
        var tips = new List<CoachingTip>();

        var laps = await _context.TelemetryLaps
            .Where(l => l.SessionId == sessionId)
            .OrderBy(l => l.LapNumber)
            .ToListAsync();

        if (laps.Count == 0)
        {
            tips.Add(new CoachingTip
            {
                Title = "Drive a few laps to unlock tips",
                Detail = "Once you complete a couple of valid laps the coach can analyse your driving and surface specific suggestions.",
                Category = "Onboarding",
                Severity = CoachingSeverity.Info
            });
            return tips;
        }

        var target = lapNumber.HasValue
            ? laps.FirstOrDefault(l => l.LapNumber == lapNumber.Value)
            : laps.OrderByDescending(l => l.LapNumber).FirstOrDefault();

        if (target == null) return tips;

        // Make sure scores are populated for the target lap
        if (target.BrakingScore == null || target.ThrottleScore == null || target.ConsistencyScore == null)
        {
            await _analytics.ComputeLapMetricsAsync(plan, sessionId, target.LapNumber);
            target = await _context.TelemetryLaps.FirstOrDefaultAsync(l => l.Id == target.Id) ?? target;
        }

        var best = laps
            .Where(l => l.IsValid && l.LapTimeMs.HasValue && l.LapTimeMs > 0)
            .OrderBy(l => l.LapTimeMs)
            .FirstOrDefault();

        if (best != null && target.LapTimeMs.HasValue && best.LapTimeMs.HasValue && target.LapNumber != best.LapNumber)
        {
            var deltaMs = target.LapTimeMs.Value - best.LapTimeMs.Value;
            if (deltaMs > 250)
            {
                tips.Add(new CoachingTip
                {
                    Title = $"Lap {target.LapNumber} is {(deltaMs / 1000.0):0.000}s off your best",
                    Detail = $"Your fastest lap was L{best.LapNumber} ({FormatLap(best.LapTimeMs)}). Look at sector deltas to find the loss.",
                    Category = "Pace",
                    Severity = CoachingSeverity.Suggestion,
                    LapNumber = target.LapNumber
                });
            }
            else if (deltaMs < -100)
            {
                tips.Add(new CoachingTip
                {
                    Title = $"New personal best on lap {target.LapNumber}!",
                    Detail = $"{FormatLap(target.LapTimeMs)} — {Math.Abs(deltaMs / 1000.0):0.000}s faster than before. Keep this rhythm.",
                    Category = "Pace",
                    Severity = CoachingSeverity.Info,
                    LapNumber = target.LapNumber
                });
            }
        }

        if (target.BrakingScore is float brake && brake < 55)
        {
            tips.Add(new CoachingTip
            {
                Title = "Brake application is inconsistent",
                Detail = "Try to peak the brake harder on initial application then release smoothly. Trail-braking should be a gradual taper, not a flutter.",
                Category = "Braking",
                Severity = brake < 35 ? CoachingSeverity.Warning : CoachingSeverity.Suggestion,
                LapNumber = target.LapNumber
            });
        }

        if (target.ThrottleScore is float thr && thr < 60)
        {
            tips.Add(new CoachingTip
            {
                Title = "Throttle inputs are jittery",
                Detail = "On corner exit, aim for a single progressive squeeze rather than multiple stabs. This protects rear tyres and improves traction on exit.",
                Category = "Throttle",
                Severity = thr < 40 ? CoachingSeverity.Warning : CoachingSeverity.Suggestion,
                LapNumber = target.LapNumber
            });
        }

        if (target.ConsistencyScore is float cons && cons < 50)
        {
            tips.Add(new CoachingTip
            {
                Title = "Lap speed variance is high",
                Detail = "Large swings in pace within a lap suggest you're attacking some sections and giving back time elsewhere. Pick a sustainable pace and build from there.",
                Category = "Consistency",
                Severity = CoachingSeverity.Suggestion,
                LapNumber = target.LapNumber
            });
        }

        if (!target.IsValid)
        {
            tips.Add(new CoachingTip
            {
                Title = "Lap was invalidated",
                Detail = "Track limits or contact invalidated this lap. Tighten your line through the corner that caused it — usually the last corner with kerb-riding.",
                Category = "Track Limits",
                Severity = CoachingSeverity.Warning,
                LapNumber = target.LapNumber
            });
        }

        var cornerTips = await GenerateCornerTipsAsync(sessionId, target);
        tips.AddRange(cornerTips);

        if (tips.Count == 0)
        {
            tips.Add(new CoachingTip
            {
                Title = "Clean, fast lap",
                Detail = "Nothing major to flag. Try working on a single channel — e.g., trail-braking deeper into the slowest corner — to find the next tenths.",
                Category = "Pace",
                Severity = CoachingSeverity.Info,
                LapNumber = target.LapNumber
            });
        }

        return tips;
    }

    private async Task<List<CoachingTip>> GenerateCornerTipsAsync(Guid sessionId, TelemetryLap target)
    {
        var tips = new List<CoachingTip>();

        var targetCorners = await _context.LapCorners
            .Where(c => c.TelemetryLapId == target.Id)
            .OrderBy(c => c.CornerIndex)
            .ToListAsync();

        if (targetCorners.Count == 0) return tips;

        var bestLap = await _context.TelemetryLaps
            .Where(l => l.SessionId == sessionId
                        && l.IsValid
                        && l.ProcessingStatus == LapProcessingStatus.Processed
                        && l.LapTimeMs != null && l.LapTimeMs > 0)
            .OrderBy(l => l.LapTimeMs)
            .Include(l => l.Corners)
            .FirstOrDefaultAsync();

        List<ReferenceCorner>? referenceCorners = null;
        var session = await _context.TelemetrySessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        if (session?.TrackProfileId != null)
        {
            var profile = await _context.TrackProfiles.FirstOrDefaultAsync(p => p.Id == session.TrackProfileId);
            if (profile != null) referenceCorners = TrackProfileBuilder.ParseReference(profile.ReferenceCorners);
        }

        string CornerName(int refIndex)
        {
            var name = referenceCorners?.FirstOrDefault(r => r.Index == refIndex)?.Name;
            return string.IsNullOrWhiteSpace(name) ? $"T{refIndex + 1}" : name!;
        }

        var pairs = new List<(LapCorner mine, LapCorner best)>();
        if (bestLap != null && bestLap.Id != target.Id && bestLap.Corners.Count > 0)
        {
            var bestByRef = bestLap.Corners
                .Where(c => c.RefCornerIndex.HasValue)
                .GroupBy(c => c.RefCornerIndex!.Value)
                .ToDictionary(g => g.Key, g => g.First());
            var bestByIndex = bestLap.Corners.ToDictionary(c => (int)c.CornerIndex);

            foreach (var mine in targetCorners)
            {
                LapCorner? match = null;
                if (mine.RefCornerIndex.HasValue && bestByRef.TryGetValue(mine.RefCornerIndex.Value, out var m))
                    match = m;
                else if (!mine.RefCornerIndex.HasValue)
                    bestByIndex.TryGetValue(mine.CornerIndex, out match);

                if (match != null) pairs.Add((mine, match));
            }
        }

        if (pairs.Count > 0)
        {
            var ordered = pairs
                .OrderByDescending(p => Math.Abs(p.mine.TimeInCornerMs - p.best.TimeInCornerMs))
                .ToList();

            foreach (var (mine, best) in ordered)
            {
                if (tips.Count >= 5) break;

                var refIndex = mine.RefCornerIndex ?? mine.CornerIndex;
                var name = CornerName(refIndex);
                var tip = BuildComparisonTip(target.LapNumber, name, refIndex, mine, best);
                if (tip != null) tips.Add(tip);
            }
        }
        else
        {
            // No comparison lap available — fall back to absolute per-corner heuristics.
            var candidates = new List<CoachingTip>();
            foreach (var mine in targetCorners)
            {
                var refIndex = mine.RefCornerIndex ?? mine.CornerIndex;
                var name = CornerName(refIndex);

                if (mine.BrakeToThrottleMs is int gapMs && gapMs > 600)
                {
                    candidates.Add(new CoachingTip
                    {
                        Title = $"{name}: long gap between brake release and throttle",
                        Detail = $"You coast for about {gapMs} ms through this corner with neither pedal applied. Try to blend brake release into throttle application.",
                        Category = "Coasting",
                        Severity = gapMs > 1000 ? CoachingSeverity.Warning : CoachingSeverity.Suggestion,
                        LapNumber = target.LapNumber,
                        CornerIndex = refIndex,
                        CornerName = name,
                        DistanceM = mine.ApexM
                    });
                }
                else if (mine.TrailBrakeM is float trail && trail < 5f && mine.BrakingPointM.HasValue)
                {
                    candidates.Add(new CoachingTip
                    {
                        Title = $"{name}: little to no trail-braking",
                        Detail = "You're releasing the brake well before the apex. Try tapering the brake pressure deeper into the corner instead of an abrupt release.",
                        Category = "Braking",
                        Severity = CoachingSeverity.Suggestion,
                        LapNumber = target.LapNumber,
                        CornerIndex = refIndex,
                        CornerName = name,
                        DistanceM = mine.BrakingPointM
                    });
                }
            }

            tips.AddRange(candidates.Take(2));
        }

        return tips;
    }

    private static CoachingTip? BuildComparisonTip(int lapNumber, string cornerName, int refIndex, LapCorner mine, LapCorner best)
    {
        // Braking point: smaller distance-to-apex value than the best lap means braking earlier.
        if (mine.BrakingPointM.HasValue && best.BrakingPointM.HasValue)
        {
            var earlierByM = best.BrakingPointM.Value - mine.BrakingPointM.Value;
            if (earlierByM >= 15f)
            {
                return new CoachingTip
                {
                    Title = $"{cornerName}: you brake {earlierByM:0} m earlier than your best lap — try carrying the brake deeper",
                    Detail = $"On your best lap through {cornerName} you brake {earlierByM:0} m later. Trust the tyres and delay the brake application.",
                    Category = "Braking",
                    Severity = earlierByM >= 30f ? CoachingSeverity.Warning : CoachingSeverity.Suggestion,
                    LapNumber = lapNumber,
                    CornerIndex = refIndex,
                    CornerName = cornerName,
                    DistanceM = mine.BrakingPointM
                };
            }
        }

        // Apex speed.
        var apexDeltaKmh = best.MinSpeedKmh - mine.MinSpeedKmh;
        if (apexDeltaKmh >= 5f)
        {
            return new CoachingTip
            {
                Title = $"{cornerName}: you're {apexDeltaKmh:0} km/h slower at the apex than your best lap",
                Detail = $"Carrying more minimum speed through {cornerName} is likely worth more than a later brake — look at your line and steering rate at the apex.",
                Category = "Cornering",
                Severity = apexDeltaKmh >= 10f ? CoachingSeverity.Warning : CoachingSeverity.Suggestion,
                LapNumber = lapNumber,
                CornerIndex = refIndex,
                CornerName = cornerName,
                DistanceM = mine.ApexM
            };
        }

        // Throttle application.
        if (mine.ThrottleOnM.HasValue && best.ThrottleOnM.HasValue)
        {
            var laterByM = mine.ThrottleOnM.Value - best.ThrottleOnM.Value;
            if (laterByM >= 20f)
            {
                return new CoachingTip
                {
                    Title = $"{cornerName}: you get back on throttle {laterByM:0} m later than your best lap",
                    Detail = $"On your best lap you're back on the power {laterByM:0} m sooner out of {cornerName}. Try squeezing the throttle earlier on exit.",
                    Category = "Throttle",
                    Severity = laterByM >= 40f ? CoachingSeverity.Warning : CoachingSeverity.Suggestion,
                    LapNumber = lapNumber,
                    CornerIndex = refIndex,
                    CornerName = cornerName,
                    DistanceM = mine.ThrottleOnM
                };
            }
        }

        // Trail-brake much shorter than the reference lap.
        if (mine.TrailBrakeM.HasValue && best.TrailBrakeM.HasValue && best.TrailBrakeM.Value > 0f)
        {
            var shortfallM = best.TrailBrakeM.Value - mine.TrailBrakeM.Value;
            if (shortfallM >= 10f && mine.TrailBrakeM.Value < best.TrailBrakeM.Value * 0.5f)
            {
                return new CoachingTip
                {
                    Title = $"{cornerName}: your trail-braking is much shorter than your best lap",
                    Detail = $"You release the brake {shortfallM:0} m sooner than your best lap through {cornerName}. Taper the brake pressure deeper towards the apex.",
                    Category = "Braking",
                    Severity = CoachingSeverity.Suggestion,
                    LapNumber = lapNumber,
                    CornerIndex = refIndex,
                    CornerName = cornerName,
                    DistanceM = mine.BrakeReleaseM ?? mine.ApexM
                };
            }
        }

        return null;
    }

    public async Task<CoachingChatReply> ChatAsync(PlanType plan, Guid sessionId, string message, IEnumerable<CoachingChatMessage>? history = null)
    {
        // Heuristic provider returns a digest from the latest tips plus a stock reply.
        var tips = await GenerateTipsAsync(plan, sessionId);
        var summary = string.Join("\n", tips.Take(3).Select(t => $"• {t.Title}"));
        var content = string.IsNullOrWhiteSpace(summary)
            ? "I don't have enough lap data yet. Drive a few more valid laps and ask again."
            : $"Based on your latest laps:\n{summary}\n\nAsk me about a specific lap, sector, or channel and I'll go deeper.";

        return new CoachingChatReply { Content = content, Provider = "heuristic" };
    }

    private static string FormatLap(int? ms)
    {
        if (ms == null || ms <= 0) return "—";
        var m = ms.Value / 60000;
        var s = (ms.Value % 60000) / 1000;
        var cs = (ms.Value % 1000) / 10;
        return $"{m}:{s:D2}.{cs:D2}";
    }
}
