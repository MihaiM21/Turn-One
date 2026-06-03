using Application.Interfaces;
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
