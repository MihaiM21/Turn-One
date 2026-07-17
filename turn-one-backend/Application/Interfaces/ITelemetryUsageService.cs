using Application.DTOs;

namespace Application.Interfaces
{
    /// <summary>
    /// Records and reports telemetry plot-generation activity, which doubles as the
    /// token-usage ledger (tokens are only spent on generation).
    /// </summary>
    public interface ITelemetryUsageService
    {
        /// <summary>Records one generation attempt for a user.</summary>
        Task LogRequestAsync(Guid userId, LogTelemetryRequestDto dto);

        /// <summary>Paginated request rows, optionally filtered by user, time range and free-text search (newest first).</summary>
        Task<TelemetryRequestPageDto> GetRequestsAsync(Guid? userId, DateTime? from, DateTime? to, int page, int pageSize, string? search = null);

        /// <summary>Token-usage time series bucketed by day/week/month.</summary>
        Task<List<TelemetryUsagePointDto>> GetUsageSeriesAsync(Guid? userId, DateTime from, DateTime to, string bucket);

        /// <summary>Aggregate summary (totals, averages, top plot types / users) over a range, optionally for one user.</summary>
        Task<TelemetryUsageSummaryDto> GetSummaryAsync(Guid? userId, DateTime from, DateTime to);

        /// <summary>Deletes a single request row. Returns false if not found.</summary>
        Task<bool> DeleteRequestAsync(Guid id);

        /// <summary>Deletes rows matching an optional user and/or "older than" cutoff. Returns rows removed.</summary>
        Task<int> DeleteRequestsAsync(Guid? userId, DateTime? olderThan);

        Task<TelemetryLogSettingsDto> GetSettingsAsync();
        Task<TelemetryLogSettingsDto> UpdateSettingsAsync(int retentionDays, bool autoDeleteEnabled);
    }
}
