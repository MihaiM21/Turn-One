using Domain.Enums;

namespace Application.Telemetry;

/// <summary>What the validator looks at for one processed lap.</summary>
public sealed record LapValidationInput(
    LapProcessingStatus Status,
    LapKind Kind,
    bool SimValid,
    int? LapTimeMs,
    int?[] SectorsMs,
    float? LapDistanceM,
    float? TrackLengthM,
    float MaxSpeedKmh);

/// <summary>
/// HCR-009 leaderboard eligibility. A lap ranks only when the sim says it was valid AND it passes
/// server checks. Failing laps stay stored and analysable; the reasons are shown on the lap page.
/// Checks that need the raw ticks (g spikes, position jumps) come with a later validator version.
/// </summary>
public static class LapValidator
{
    public const int Version = 1;

    public const int SectorSumToleranceMs = 50;
    public const float DistanceTolerance = 0.03f;
    public const float MaxPlausibleSpeedKmh = 420f;

    public static IReadOnlyList<string> Check(LapValidationInput lap)
    {
        var reasons = new List<string>();

        if (lap.Status != LapProcessingStatus.Processed) reasons.Add("not_processed");
        if (!lap.SimValid) reasons.Add("sim_invalid");
        if (lap.Kind != LapKind.Flying) reasons.Add("not_flying_lap");
        if (lap.LapTimeMs is not > 0) reasons.Add("no_lap_time");

        if (lap.LapTimeMs is > 0 && lap.SectorsMs.Length > 0 && lap.SectorsMs.All(s => s is > 0))
        {
            var sum = lap.SectorsMs.Sum(s => s!.Value);
            if (Math.Abs(sum - lap.LapTimeMs.Value) > SectorSumToleranceMs) reasons.Add("sector_sum_mismatch");
        }

        if (lap.TrackLengthM is > 0 && lap.LapDistanceM is > 0)
        {
            var ratio = lap.LapDistanceM.Value / lap.TrackLengthM.Value;
            if (ratio < 1 - DistanceTolerance) reasons.Add("distance_short");
            else if (ratio > 1 + DistanceTolerance) reasons.Add("distance_long");
        }

        if (lap.MaxSpeedKmh > MaxPlausibleSpeedKmh) reasons.Add("speed_implausible");

        return reasons;
    }
}
