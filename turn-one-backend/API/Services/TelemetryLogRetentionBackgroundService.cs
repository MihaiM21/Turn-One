using Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

/// <summary>
/// Periodically prunes telemetry generation-request logs older than the admin-configured
/// retention window (when auto-delete is enabled). Runs hourly.
/// </summary>
public class TelemetryLogRetentionBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TelemetryLogRetentionBackgroundService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1);

    public TelemetryLogRetentionBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<TelemetryLogRetentionBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Telemetry Log Retention Background Service is starting");

        // Initial delay to let the application start properly
        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PruneAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while pruning telemetry logs");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("Telemetry Log Retention Background Service is stopping");
    }

    private async Task PruneAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TurnOneDbContext>();

        var settings = await db.TelemetryLogSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings == null || !settings.AutoDeleteEnabled)
        {
            return;
        }

        var retentionDays = settings.RetentionDays < 1 ? 1 : settings.RetentionDays;
        var cutoff = DateTime.UtcNow.AddDays(-retentionDays);

        var removed = await db.TelemetryGenerationRequests
            .Where(r => r.CreatedAt < cutoff)
            .ExecuteDeleteAsync(cancellationToken);

        if (removed > 0)
        {
            _logger.LogInformation(
                "Pruned {Count} telemetry generation requests older than {RetentionDays} days",
                removed, retentionDays);
        }
    }
}
