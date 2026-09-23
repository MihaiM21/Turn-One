namespace Domain.Enums;

/// <summary>
/// Which simulator produced a telemetry session. Stored on <c>TelemetrySession</c> and used as
/// half of the <c>TrackProfile</c> key — the same real-world circuit is a different profile per sim
/// because layouts, start/finish lines and lap distances differ between titles.
/// </summary>
public enum SimSource
{
    /// <summary>Assetto Corsa Competizione (shared memory). Also the default for legacy sessions recorded before the source was tracked.</summary>
    Acc = 0,
    /// <summary>Assetto Corsa (original, shared memory).</summary>
    Ac = 1,
    /// <summary>iRacing (IRSDK).</summary>
    IRacing = 2,
    /// <summary>EA SPORTS F1 25 (UDP, packetFormat 2025).</summary>
    F1_25 = 3,
    /// <summary>EA SPORTS F1 26 / 2026 Season Pack (UDP, packetFormat 2026).</summary>
    F1_26 = 4,
    Unknown = 99
}
