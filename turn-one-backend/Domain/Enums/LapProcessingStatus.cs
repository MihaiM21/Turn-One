namespace Domain.Enums;

public enum LapProcessingStatus
{
    /// <summary>Lap row exists (v1 ingestion) but no processed telemetry record yet; a backfill can produce one.</summary>
    Legacy = 0,
    /// <summary>Queued for the lap processor.</summary>
    Pending = 1,
    /// <summary>Processed; a <c>LapTelemetry</c> record and <c>LapCorner</c> rows exist.</summary>
    Processed = 2,
    /// <summary>Deliberately not processed (buffer overflow, aborted lap). See <c>ProcessingError</c>.</summary>
    Skipped = 3,
    /// <summary>Processor threw. See <c>ProcessingError</c>; reprocess to retry.</summary>
    Failed = 4
}
