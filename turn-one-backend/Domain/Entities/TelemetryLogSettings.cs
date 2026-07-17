namespace Domain.Entities
{
    /// <summary>
    /// Single-row configuration controlling automatic pruning of telemetry generation logs.
    /// Managed by admins from the usage dashboard.
    /// </summary>
    public class TelemetryLogSettings
    {
        public Guid Id { get; set; }

        /// <summary>Age (in days) beyond which log rows are eligible for automatic deletion.</summary>
        public int RetentionDays { get; set; } = 90;

        /// <summary>When true, the retention background worker prunes rows older than RetentionDays.</summary>
        public bool AutoDeleteEnabled { get; set; } = true;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
