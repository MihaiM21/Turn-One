namespace Application.DTOs
{
    /// <summary>Payload sent by the client after each plot-generation attempt.</summary>
    public class LogTelemetryRequestDto
    {
        public string PlotType { get; set; } = string.Empty;
        public int Year { get; set; }
        public string EventName { get; set; } = string.Empty;
        public string Session { get; set; } = string.Empty;
        public string? Drivers { get; set; }
        public int DurationMs { get; set; }
        public bool Success { get; set; }
        public int TokensUsed { get; set; }
        public string? ErrorMessage { get; set; }
    }

    /// <summary>A single telemetry generation request row, with the user resolved for display.</summary>
    public class TelemetryRequestDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string PlotType { get; set; } = string.Empty;
        public int Year { get; set; }
        public string EventName { get; set; } = string.Empty;
        public string Session { get; set; } = string.Empty;
        public string? Drivers { get; set; }
        public int DurationMs { get; set; }
        public bool Success { get; set; }
        public int TokensUsed { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>Paginated set of request rows.</summary>
    public class TelemetryRequestPageDto
    {
        public List<TelemetryRequestDto> Items { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
    }

    /// <summary>One bucket in a token-usage time series.</summary>
    public class TelemetryUsagePointDto
    {
        /// <summary>Start of the bucket (UTC date).</summary>
        public DateTime PeriodStart { get; set; }
        public int TokensUsed { get; set; }
        public int RequestCount { get; set; }
    }

    /// <summary>Aggregate summary over a time range.</summary>
    public class TelemetryUsageSummaryDto
    {
        public int TotalTokensUsed { get; set; }
        public int TotalRequests { get; set; }
        public int SuccessfulRequests { get; set; }
        public int FailedRequests { get; set; }
        public double AverageDurationMs { get; set; }
        public List<TelemetryUsageCountDto> TopPlotTypes { get; set; } = new();
        public List<TelemetryUsageCountDto> TopUsers { get; set; } = new();
    }

    public class TelemetryUsageCountDto
    {
        public string Label { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class TelemetryLogSettingsDto
    {
        public int RetentionDays { get; set; }
        public bool AutoDeleteEnabled { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UpdateTelemetryLogSettingsDto
    {
        public int RetentionDays { get; set; }
        public bool AutoDeleteEnabled { get; set; }
    }
}
