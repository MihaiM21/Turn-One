using System.Globalization;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services
{
    public class TelemetryUsageService : ITelemetryUsageService
    {
        private readonly TurnOneDbContext _context;

        public TelemetryUsageService(TurnOneDbContext context)
        {
            _context = context;
        }

        public async Task LogRequestAsync(Guid userId, LogTelemetryRequestDto dto)
        {
            var entry = new TelemetryGenerationRequest
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                PlotType = dto.PlotType ?? string.Empty,
                Year = dto.Year,
                EventName = dto.EventName ?? string.Empty,
                Session = dto.Session ?? string.Empty,
                Drivers = string.IsNullOrWhiteSpace(dto.Drivers) ? null : dto.Drivers,
                DurationMs = dto.DurationMs < 0 ? 0 : dto.DurationMs,
                Success = dto.Success,
                // Trust the client only up to 1 token; a failed attempt never costs a token.
                TokensUsed = dto.Success ? Math.Clamp(dto.TokensUsed, 0, 1) : 0,
                ErrorMessage = string.IsNullOrWhiteSpace(dto.ErrorMessage) ? null : Truncate(dto.ErrorMessage, 1000),
                CreatedAt = DateTime.UtcNow,
            };

            _context.TelemetryGenerationRequests.Add(entry);
            await _context.SaveChangesAsync();
        }

        public async Task<TelemetryRequestPageDto> GetRequestsAsync(Guid? userId, DateTime? from, DateTime? to, int page, int pageSize, string? search = null)
        {
            page = page < 1 ? 1 : page;
            pageSize = Math.Clamp(pageSize, 1, 200);

            var query = _context.TelemetryGenerationRequests.AsNoTracking().AsQueryable();
            if (userId.HasValue) query = query.Where(r => r.UserId == userId.Value);
            if (from.HasValue) query = query.Where(r => r.CreatedAt >= from.Value);
            if (to.HasValue) query = query.Where(r => r.CreatedAt <= to.Value);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                var pattern = $"%{term}%";
                query = query.Where(r =>
                    EF.Functions.Like(r.User.Username, pattern) ||
                    EF.Functions.Like(r.PlotType, pattern) ||
                    EF.Functions.Like(r.EventName, pattern) ||
                    EF.Functions.Like(r.Session, pattern) ||
                    (r.Drivers != null && EF.Functions.Like(r.Drivers, pattern)));
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new TelemetryRequestDto
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    Username = r.User.Username,
                    PlotType = r.PlotType,
                    Year = r.Year,
                    EventName = r.EventName,
                    Session = r.Session,
                    Drivers = r.Drivers,
                    DurationMs = r.DurationMs,
                    Success = r.Success,
                    TokensUsed = r.TokensUsed,
                    ErrorMessage = r.ErrorMessage,
                    CreatedAt = r.CreatedAt,
                })
                .ToListAsync();

            return new TelemetryRequestPageDto
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
            };
        }

        public async Task<List<TelemetryUsagePointDto>> GetUsageSeriesAsync(Guid? userId, DateTime from, DateTime to, string bucket)
        {
            var query = _context.TelemetryGenerationRequests.AsNoTracking()
                .Where(r => r.CreatedAt >= from && r.CreatedAt <= to);
            if (userId.HasValue) query = query.Where(r => r.UserId == userId.Value);

            // Pull only what we need and bucket in memory to stay portable across SQLite/Postgres.
            var rows = await query
                .Select(r => new { r.CreatedAt, r.TokensUsed })
                .ToListAsync();

            var normalizedBucket = (bucket ?? "day").ToLowerInvariant();

            return rows
                .GroupBy(r => BucketStart(r.CreatedAt, normalizedBucket))
                .Select(g => new TelemetryUsagePointDto
                {
                    PeriodStart = g.Key,
                    TokensUsed = g.Sum(x => x.TokensUsed),
                    RequestCount = g.Count(),
                })
                .OrderBy(p => p.PeriodStart)
                .ToList();
        }

        public async Task<TelemetryUsageSummaryDto> GetSummaryAsync(Guid? userId, DateTime from, DateTime to)
        {
            var query = _context.TelemetryGenerationRequests.AsNoTracking()
                .Where(r => r.CreatedAt >= from && r.CreatedAt <= to);
            if (userId.HasValue) query = query.Where(r => r.UserId == userId.Value);

            var rows = await query
                .Select(r => new { r.PlotType, r.TokensUsed, r.Success, r.DurationMs, r.UserId, Username = r.User.Username })
                .ToListAsync();

            var summary = new TelemetryUsageSummaryDto
            {
                TotalTokensUsed = rows.Sum(r => r.TokensUsed),
                TotalRequests = rows.Count,
                SuccessfulRequests = rows.Count(r => r.Success),
                FailedRequests = rows.Count(r => !r.Success),
                AverageDurationMs = rows.Count > 0 ? Math.Round(rows.Average(r => r.DurationMs), 1) : 0,
                TopPlotTypes = rows
                    .GroupBy(r => r.PlotType)
                    .Select(g => new TelemetryUsageCountDto { Label = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .Take(5)
                    .ToList(),
                TopUsers = rows
                    .GroupBy(r => r.Username)
                    .Select(g => new TelemetryUsageCountDto { Label = g.Key, Count = g.Sum(x => x.TokensUsed) })
                    .OrderByDescending(x => x.Count)
                    .Take(5)
                    .ToList(),
            };

            return summary;
        }

        public async Task<bool> DeleteRequestAsync(Guid id)
        {
            var entry = await _context.TelemetryGenerationRequests.FindAsync(id);
            if (entry == null) return false;

            _context.TelemetryGenerationRequests.Remove(entry);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> DeleteRequestsAsync(Guid? userId, DateTime? olderThan)
        {
            var query = _context.TelemetryGenerationRequests.AsQueryable();
            if (userId.HasValue) query = query.Where(r => r.UserId == userId.Value);
            if (olderThan.HasValue) query = query.Where(r => r.CreatedAt < olderThan.Value);

            return await query.ExecuteDeleteAsync();
        }

        public async Task<TelemetryLogSettingsDto> GetSettingsAsync()
        {
            var settings = await GetOrCreateSettingsAsync();
            return ToDto(settings);
        }

        public async Task<TelemetryLogSettingsDto> UpdateSettingsAsync(int retentionDays, bool autoDeleteEnabled)
        {
            var settings = await GetOrCreateSettingsAsync();
            settings.RetentionDays = retentionDays < 1 ? 1 : retentionDays;
            settings.AutoDeleteEnabled = autoDeleteEnabled;
            settings.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return ToDto(settings);
        }

        private async Task<TelemetryLogSettings> GetOrCreateSettingsAsync()
        {
            var settings = await _context.TelemetryLogSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new TelemetryLogSettings
                {
                    Id = Guid.NewGuid(),
                    RetentionDays = 90,
                    AutoDeleteEnabled = true,
                    UpdatedAt = DateTime.UtcNow,
                };
                _context.TelemetryLogSettings.Add(settings);
                await _context.SaveChangesAsync();
            }
            return settings;
        }

        private static TelemetryLogSettingsDto ToDto(TelemetryLogSettings s) => new()
        {
            RetentionDays = s.RetentionDays,
            AutoDeleteEnabled = s.AutoDeleteEnabled,
            UpdatedAt = s.UpdatedAt,
        };

        private static DateTime BucketStart(DateTime dt, string bucket)
        {
            var date = dt.Date;
            return bucket switch
            {
                "month" => new DateTime(date.Year, date.Month, 1, 0, 0, 0, DateTimeKind.Utc),
                "week" => DateTime.SpecifyKind(date.AddDays(-(int)CultureInfo.InvariantCulture.Calendar.GetDayOfWeek(date)), DateTimeKind.Utc),
                _ => DateTime.SpecifyKind(date, DateTimeKind.Utc),
            };
        }

        private static string Truncate(string value, int max) =>
            value.Length <= max ? value : value.Substring(0, max);
    }
}
