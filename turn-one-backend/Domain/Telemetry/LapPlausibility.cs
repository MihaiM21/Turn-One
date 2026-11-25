namespace Domain.Telemetry;

/// <summary>
/// The one rule for whether a lap time can be a session's best (BUG-019). A valid flag from the
/// sim is not enough: a 30 ms "lap" once became a session best and headlined the dashboard.
/// </summary>
public static class LapPlausibility
{
    /// <summary>No circuit in the supported sims has a lap under 20 s.</summary>
    public const int MinLapMs = 20_000;

    /// <summary>Faster than any car in the supported sims averages over a lap: 100 m/s (360 km/h).</summary>
    public const float MaxAverageSpeedMps = 100f;

    /// <summary>
    /// The shortest believable lap: 20 s, or the track length covered at 360 km/h when the
    /// length is known and that is longer.
    /// </summary>
    public static int MinLapMsFor(float? trackLengthM) =>
        trackLengthM is > 0
            ? Math.Max(MinLapMs, (int)(trackLengthM.Value / MaxAverageSpeedMps * 1000f))
            : MinLapMs;

    /// <summary>True when <paramref name="lapMs"/> could be a real lap on a track of the given length.</summary>
    public static bool IsPlausible(int? lapMs, float? trackLengthM = null) =>
        lapMs is { } ms && ms >= MinLapMsFor(trackLengthM);

    /// <summary>
    /// The session best after a lap: the lap wins only when it is valid, plausible and faster;
    /// an implausible current best is always replaced by a plausible lap.
    /// </summary>
    public static int NextSessionBest(int currentBestMs, int? lapMs, bool lapValid, float? trackLengthM = null)
    {
        if (!lapValid || !IsPlausible(lapMs, trackLengthM)) return currentBestMs;
        var lap = lapMs!.Value;
        return IsPlausible(currentBestMs, trackLengthM) ? Math.Min(currentBestMs, lap) : lap;
    }
}
