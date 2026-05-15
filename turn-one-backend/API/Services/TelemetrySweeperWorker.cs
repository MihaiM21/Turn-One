using Application.Interfaces;
using Domain.Enums;

namespace API.Services;

public class TelemetrySweeperWorker : BackgroundService
{
    private readonly TelemetryIngestionService _ingestionService;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TelemetrySweeperWorker> _logger;

    private static readonly TimeSpan SweepInterval = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan HeartbeatTimeout = TimeSpan.FromSeconds(90);

    public TelemetrySweeperWorker(TelemetryIngestionService ingestionService, IServiceScopeFactory scopeFactory, ILogger<TelemetrySweeperWorker> logger)
    {
        _ingestionService = ingestionService;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Telemetry Sweeper Worker started (interval {Interval}s, timeout {Timeout}s)",
            SweepInterval.TotalSeconds, HeartbeatTimeout.TotalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(SweepInterval, stoppingToken);

            try
            {
                var cutoff = DateTime.UtcNow - HeartbeatTimeout;
                using var scope = _scopeFactory.CreateScope();
                var svc = scope.ServiceProvider.GetRequiredService<ITelemetrySessionService>();
                var staleSessions = await svc.GetSessionsLastSeenBeforeAsync(cutoff);

                foreach (var session in staleSessions)
                {
                    _logger.LogInformation("Sweeper closing stale session {SessionId} (last seen {LastSeen})",
                        session.Id, session.LastSeenAt);
                    await _ingestionService.SweepSessionAsync(session.Id);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in telemetry sweeper");
            }
        }
    }
}
