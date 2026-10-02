namespace Application.Telemetry;

/// <summary>Decision returned by <see cref="LapCutRule.Decide"/> for one incoming v2 tick.</summary>
public enum LapCutDecision
{
    /// <summary>Same lap — append the tick to the current buffer.</summary>
    Continue,
    /// <summary>The lap counter moved forward past the S/F line — close the current buffer as a completed lap and start a new one with this tick.</summary>
    CutAndStart,
    /// <summary>The lap counter moved backward (flashback / restart) — discard the current buffer and start a new one with this tick.</summary>
    Discard,
    /// <summary>Same lap number but the lap clock restarted (ACC resets <c>iCurrentTime</c> when the car leaves the pit lane / crosses the line on an out-lap without bumping <c>completedLaps</c>) — the buffered fragment is an out-lap stub; discard it and restart the same lap number with this tick.</summary>
    Restart
}

/// <summary>
/// Pure lap-cut decision for protocol-v2 ingestion, extracted out of <c>TelemetryIngestionService</c>
/// so the boundary logic (which laps get cut, discarded or continued) is unit-testable without spinning
/// up the WebSocket pipeline. See <c>docs/architecture/sim-telemetry-protocol-v2.md</c> §3/§6.
/// </summary>
public static class LapCutRule
{
    /// <summary>Fraction of the track length below which a lap-counter increment is trusted as a genuine S/F crossing (guards against a lap bump right before the line due to jitter).</summary>
    public const float StartOfLapFraction = 0.15f;

    /// <summary>A lap clock that drops by more than this within the same lap number is a restart, not jitter.</summary>
    public const float LapClockResetMs = 5_000f;

    /// <summary>
    /// <paramref name="currentLap"/>: lap number the buffer currently belongs to (0 = no lap started yet).
    /// <paramref name="tickLap"/>: lap number reported on the incoming tick.
    /// <paramref name="tickLapDistM"/>: incoming tick's distance from S/F on its lap; NaN when unknown.
    /// <paramref name="trackLengthM"/>: session track length, metres; null/≤0 when unknown.
    /// </summary>
    public static LapCutDecision Decide(int currentLap, int tickLap, float tickLapDistM, float? trackLengthM)
        => Decide(currentLap, tickLap, tickLapDistM, trackLengthM, float.NaN, float.NaN);

    /// <summary>
    /// Overload that also watches the lap clock: <paramref name="lastLapTimeMs"/> is the lap time on the
    /// last buffered tick and <paramref name="tickLapTimeMs"/> the incoming one (NaN when unknown).
    /// </summary>
    public static LapCutDecision Decide(int currentLap, int tickLap, float tickLapDistM, float? trackLengthM, float lastLapTimeMs, float tickLapTimeMs)
    {
        if (tickLap == currentLap && currentLap > 0
            && !float.IsNaN(lastLapTimeMs) && !float.IsNaN(tickLapTimeMs)
            && lastLapTimeMs - tickLapTimeMs > LapClockResetMs)
            return LapCutDecision.Restart;

        if (tickLap > currentLap)
        {
            var length = trackLengthM ?? 0f;
            var nearStart = currentLap == 0
                || length <= 0
                || float.IsNaN(tickLapDistM)
                || tickLapDistM < StartOfLapFraction * length;

            return nearStart ? LapCutDecision.CutAndStart : LapCutDecision.Continue;
        }

        if (tickLap < currentLap)
            return LapCutDecision.Discard;

        return LapCutDecision.Continue;
    }
}
