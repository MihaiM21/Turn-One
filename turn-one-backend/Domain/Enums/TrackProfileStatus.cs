namespace Domain.Enums;

public enum TrackProfileStatus
{
    /// <summary>Built from the first valid lap; reference corners are still being accumulated.</summary>
    Provisional = 0,
    /// <summary>Reference corners are medians over ≥ 10 laps.</summary>
    Stable = 1,
    /// <summary>Seeded from a checked-in profile (corner names etc.); never auto-rebuilt.</summary>
    Curated = 2
}
