namespace Domain.Enums;

/// <summary>What kind of lap a <c>TelemetryLap</c> is, decided by the lap processor from pit flags and coverage.</summary>
public enum LapKind
{
    /// <summary>Full lap, started and finished on track. The only kind that can be valid or a best lap.</summary>
    Flying = 0,
    /// <summary>Started in the pit lane / box.</summary>
    OutLap = 1,
    /// <summary>Ended in the pit lane / box.</summary>
    InLap = 2,
    /// <summary>Touched the pit lane somewhere in between (drive-through, or both in and out).</summary>
    Pit = 3,
    /// <summary>Did not cover the whole track (session start mid-lap, data gap &gt; 50 m, session ended early).</summary>
    Partial = 4,
    /// <summary>Discarded mid-lap: flashback, reset to pits, session restart.</summary>
    Aborted = 5
}
