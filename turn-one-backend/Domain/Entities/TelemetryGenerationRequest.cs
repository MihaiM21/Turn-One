namespace Domain.Entities
{
    /// <summary>
    /// Records a single telemetry plot-generation attempt made by a user.
    /// Tokens are only ever spent on plot generation, so this table doubles as the
    /// token-usage ledger (aggregations power admin usage graphs) and the request-detail
    /// log (individual rows show what was generated, when, and how long the data fetch took).
    /// </summary>
    public class TelemetryGenerationRequest
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        /// <summary>Plot identifier, e.g. "topspeeds", "throttle_brake", "lap_distribution".</summary>
        public string PlotType { get; set; } = string.Empty;

        public int Year { get; set; }

        /// <summary>Grand Prix / event name the plot was generated for.</summary>
        public string EventName { get; set; } = string.Empty;

        /// <summary>Session code, e.g. "FP1", "Q", "R".</summary>
        public string Session { get; set; } = string.Empty;

        /// <summary>Comma-separated driver codes involved in the plot, if any.</summary>
        public string? Drivers { get; set; }

        /// <summary>Client-measured "return time" of the external data fetch, in milliseconds.</summary>
        public int DurationMs { get; set; }

        public bool Success { get; set; }

        /// <summary>Tokens consumed by this attempt (1 on success, 0 on failure).</summary>
        public int TokensUsed { get; set; }

        public string? ErrorMessage { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
