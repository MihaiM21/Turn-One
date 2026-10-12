using Domain.Enums;

namespace Application.Telemetry;

/// <summary>Result of turning a raw tick buffer into a clean, monotonic distance axis.</summary>
public sealed class NormalizedLap
{
    /// <summary>Ticks kept, in time order. Shorter than the input when the lap was truncated.</summary>
    public required IReadOnlyList<TickV2> Ticks { get; init; }
    /// <summary>Distance from the line for each kept tick, metres, strictly non-decreasing.</summary>
    public required float[] DistanceM { get; init; }
    public required LapKind Kind { get; init; }
    public required DistanceSource DistanceSource { get; init; }
    /// <summary>Distance at the last kept tick.</summary>
    public float LengthM => DistanceM.Length == 0 ? 0 : DistanceM[^1];
    /// <summary>Fraction of the known track length covered (1 when the track length is unknown).</summary>
    public required float Coverage { get; init; }
    /// <summary>Number of holes &gt; 2 s that were interpolated across.</summary>
    public required int Gaps { get; init; }
    /// <summary>Set when <see cref="Kind"/> is Aborted / Partial for a data reason.</summary>
    public string? Reason { get; init; }
}

public static class LapDistanceNormalizer
{
    /// <summary>A backward step larger than this is a flashback / reset, not jitter.</summary>
    public const float MaxBackwardStepM = 5f;
    /// <summary>A distance hole larger than this makes the lap Partial rather than interpolating across it.</summary>
    public const float MaxGapM = 50f;
    public const float GapSeconds = 2f;
    /// <summary>Below this fraction of the track length a lap is Partial.</summary>
    public const float MinCoverage = 0.97f;
    /// <summary>Speed-integrated length within this fraction of the known length is rescaled onto it.</summary>
    public const float RescaleTolerance = 0.04f;

    /// <summary>
    /// Builds the distance axis for one lap's ticks.
    /// Uses the sim's <c>lapDistM</c> when present; otherwise integrates speed. Classifies the lap by pit
    /// flags and coverage, and truncates on a flashback / reset.
    /// </summary>
    /// <param name="ticks">Ticks of one lap in time order (first tick is the first sample after the line).</param>
    /// <param name="trackLengthM">Known track length, or null/0 when unknown.</param>
    public static NormalizedLap Normalize(IReadOnlyList<TickV2> ticks, float? trackLengthM)
    {
        if (ticks.Count < 2)
        {
            return new NormalizedLap
            {
                Ticks = ticks, DistanceM = ticks.Select(t => 0f).ToArray(), Kind = LapKind.Partial,
                DistanceSource = DistanceSource.LapDistance, Coverage = 0, Gaps = 0, Reason = "too few ticks"
            };
        }

        var hasLength = trackLengthM is > 0;
        var length = hasLength ? trackLengthM!.Value : 0f;

        // Does the sim give us lap distance at all? A Link that doesn't know the track length sends
        // normalizedPosition x 0, so a distance channel that never moves counts as absent too.
        var hasLapDist = ticks.Count(t => t.Has(TickLayout.LapDistM)) >= ticks.Count / 2
            && DistanceSpan(ticks) > MinDistanceSpanM;

        var kept = new List<TickV2>(ticks.Count);
        var dist = new List<float>(ticks.Count);
        var source = hasLapDist ? DistanceSource.LapDistance : DistanceSource.SpeedIntegrated;
        string? reason = null;
        var aborted = false;
        var gaps = 0;
        var maxGapM = 0f;

        if (hasLapDist)
        {
            float? prev = null;
            for (var i = 0; i < ticks.Count; i++)
            {
                var t = ticks[i];
                var d = t.LapDistM;
                if (float.IsNaN(d))
                {
                    // Hold the previous distance for the odd tick without it.
                    if (prev == null) continue;
                    d = prev.Value;
                }

                // Pre-line negative distance (F1) or S/F jitter on the first sample.
                if (d < 0) d = 0;
                if (prev == null && hasLength && d > length * 0.9f) d = 0;

                if (prev != null)
                {
                    var step = d - prev.Value;
                    if (step < -MaxBackwardStepM)
                    {
                        // Flashback or reset. Jitter within the last 1 % of the lap is clamped instead.
                        if (hasLength && prev.Value > length * 0.99f) { d = prev.Value; }
                        else { aborted = true; reason = $"distance went backwards by {-step:F1} m at tick {i}"; break; }
                    }
                    else if (step < 0)
                    {
                        d = prev.Value; // tiny jitter: hold
                    }
                    else
                    {
                        var dt = (t.T - kept[^1].T) / 1000f;
                        if (dt > GapSeconds)
                        {
                            gaps++;
                            maxGapM = MathF.Max(maxGapM, step);
                        }
                    }
                }

                kept.Add(t);
                dist.Add(d);
                prev = d;
            }
        }
        else
        {
            // Trapezoidal integration of speed. Speed is km/h.
            var d = 0f;
            var prevSpeed = SpeedOrZero(ticks[0]);
            kept.Add(ticks[0]);
            dist.Add(0f);
            for (var i = 1; i < ticks.Count; i++)
            {
                var t = ticks[i];
                var dt = (t.T - ticks[i - 1].T) / 1000f;
                if (dt < 0) { aborted = true; reason = "timestamps went backwards"; break; }
                var speed = SpeedOrZero(t);
                var step = (prevSpeed + speed) / 2f / 3.6f * dt;
                if (dt > GapSeconds) { gaps++; maxGapM = MathF.Max(maxGapM, step); }
                d += step;
                kept.Add(t);
                dist.Add(d);
                prevSpeed = speed;
            }

            // Rescale onto the known length when the integration is close enough to trust.
            if (!aborted && hasLength && d > 0)
            {
                var ratio = length / d;
                if (MathF.Abs(1f - ratio) <= RescaleTolerance)
                {
                    for (var i = 0; i < dist.Count; i++) dist[i] *= ratio;
                }
            }
        }

        var distance = dist.ToArray();
        var lengthM = distance.Length == 0 ? 0 : distance[^1];
        var coverage = hasLength ? lengthM / length : 1f;

        var kind = Classify(kept, coverage, maxGapM, aborted, ref reason);

        return new NormalizedLap
        {
            Ticks = kept,
            DistanceM = distance,
            Kind = kind,
            DistanceSource = source,
            Coverage = coverage,
            Gaps = gaps,
            Reason = reason
        };
    }

    /// <summary>A lap-distance channel spanning less than this is treated as absent (constant / all-zero).</summary>
    public const float MinDistanceSpanM = 10f;

    private static float DistanceSpan(IReadOnlyList<TickV2> ticks)
    {
        float min = float.PositiveInfinity, max = float.NegativeInfinity;
        foreach (var t in ticks)
        {
            var d = t.LapDistM;
            if (float.IsNaN(d)) continue;
            if (d < min) min = d;
            if (d > max) max = d;
        }
        return max > min ? max - min : 0f;
    }

    private static float SpeedOrZero(TickV2 t) => float.IsNaN(t.Speed) ? 0f : MathF.Max(0f, t.Speed);

    private static LapKind Classify(List<TickV2> kept, float coverage, float maxGapM, bool aborted, ref string? reason)
    {
        if (aborted) return LapKind.Aborted;
        if (kept.Count < 2) { reason ??= "too few ticks"; return LapKind.Partial; }

        var firstPit = PitOf(kept[0]) >= 1;
        var lastPit = PitOf(kept[^1]) >= 1;
        var anyPit = kept.Any(t => PitOf(t) >= 1);

        if (firstPit && lastPit) return LapKind.Pit;
        if (firstPit) return LapKind.OutLap;
        if (lastPit) return LapKind.InLap;
        if (anyPit) return LapKind.Pit;

        if (maxGapM > MaxGapM) { reason ??= $"data gap of {maxGapM:F0} m"; return LapKind.Partial; }
        if (coverage < MinCoverage) { reason ??= $"covered {coverage:P0} of the track"; return LapKind.Partial; }
        return LapKind.Flying;
    }

    private static int PitOf(TickV2 t) => t.Has(TickLayout.Pit) ? (int)t.Pit : 0;
}
