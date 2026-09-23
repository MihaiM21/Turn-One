using Application.Interfaces;
using Application.Telemetry;
using Domain.Entities;
using Domain.Telemetry;
using Infrastructure.Data;

namespace Infrastructure.Services;

/// <summary>
/// Turns protocol-v1 (ACC shared-memory) raw archive rows into protocol-v2 <see cref="TickV2"/>s so the
/// same lap pipeline (<see cref="LapDistanceNormalizer"/>, <see cref="LapResampler"/>, <see cref="LapSummaryCalculator"/>,
/// <see cref="CornerDetector"/>) can process both. Physics rows (60 Hz) are the timeline; each is paired
/// with the most recently seen graphics row's fields (sample-and-hold — graphics updates less often).
/// </summary>
public static class LegacyTickAdapter
{
    /// <summary>Keys that need a transform rather than a straight canonical-name copy.</summary>
    private static readonly HashSet<string> SpecialKeys = new(StringComparer.Ordinal)
    {
        ChannelRegistry.V1Gear,
        ChannelRegistry.V1NormalizedCarPosition,
        ChannelRegistry.V1CompletedLaps,
    };

    /// <summary>
    /// Converts one session's raw v1 ticks into v2 ticks. <paramref name="trackLengthM"/> resolution order is
    /// the caller's job (session length, then profile length, then <see cref="AccTrackLengths"/>); when it is
    /// null or non-positive, <c>lapDistM</c> is left NaN (the pipeline falls back to speed integration).
    /// </summary>
    public static List<TickV2> Convert(IReadOnlyList<RawTick> rawTicks, float? trackLengthM)
    {
        var physicsRows = rawTicks.Where(t => t.MsgType == ChannelRegistry.Physics).OrderBy(t => t.Time).ToList();
        var graphicsRows = rawTicks.Where(t => t.MsgType == ChannelRegistry.Graphics).OrderBy(t => t.Time).ToList();
        var length = trackLengthM is > 0 ? trackLengthM : null;

        var result = new List<TickV2>(physicsRows.Count);
        var gi = 0;
        var graphicsSnapshot = new Dictionary<string, double>(StringComparer.Ordinal);

        foreach (var p in physicsRows)
        {
            // Advance the graphics cursor, merging (not replacing) so fields absent from a later row persist.
            while (gi < graphicsRows.Count && graphicsRows[gi].Time <= p.Time)
            {
                foreach (var (k, v) in graphicsRows[gi].Fields) graphicsSnapshot[k] = v;
                gi++;
            }

            var tick = TickV2.Empty(new DateTimeOffset(p.Time, TimeSpan.Zero).ToUnixTimeMilliseconds());
            ApplyGenericFields(tick, p.Fields);
            ApplyGenericFields(tick, graphicsSnapshot);
            ApplySpecialFields(tick, p.Fields, length);
            ApplySpecialFields(tick, graphicsSnapshot, length);
            result.Add(tick);
        }

        return result;
    }

    /// <summary>Straight canonical-name copies (v1 → v2 key aliasing, corner-suffixed keys included).</summary>
    private static void ApplyGenericFields(TickV2 tick, Dictionary<string, double> fields)
    {
        foreach (var (key, value) in fields)
        {
            if (SpecialKeys.Contains(key)) continue;
            var canonical = ChannelRegistry.Canonical(key);
            if (TickLayout.TryOrdinal(canonical, out var ordinal))
                tick.V[ordinal] = (float)value;
        }
    }

    private static void ApplySpecialFields(TickV2 tick, Dictionary<string, double> fields, float? trackLengthM)
    {
        // ACC raw gear: 0 = R, 1 = N, 2 = 1st, … → v2: −1 = R, 0 = N, 1 = 1st, …
        if (fields.TryGetValue(ChannelRegistry.V1Gear, out var rawGear))
            tick.V[TickLayout.Gear] = (float)rawGear - 1f;

        // 0..1 spline position × known track length. Left NaN (speed-integrated fallback) when no length.
        if (fields.TryGetValue(ChannelRegistry.V1NormalizedCarPosition, out var pos))
            tick.V[TickLayout.LapDistM] = trackLengthM is > 0 ? (float)pos * trackLengthM.Value : float.NaN;

        // completedLaps is the count of laps finished so far; the lap in progress is one more than that.
        if (fields.TryGetValue(ChannelRegistry.V1CompletedLaps, out var completed))
            tick.V[TickLayout.Lap] = (float)completed + 1f;
    }
}
