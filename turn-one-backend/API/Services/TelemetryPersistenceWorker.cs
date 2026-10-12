using Application.Interfaces;
using Domain.Enums;
using System.Threading.Channels;

namespace API.Services;

public class TelemetryPersistenceWorker : BackgroundService
{
    private readonly Channel<TickItem> _tickChannel;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TelemetryPersistenceWorker> _logger;

    public TelemetryPersistenceWorker(Channel<TickItem> tickChannel, IServiceProvider serviceProvider, ILogger<TelemetryPersistenceWorker> logger)
    {
        _tickChannel = tickChannel;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Telemetry Persistence Worker started");

        var batch = new List<TickItem>();
        var flushInterval = TimeSpan.FromMilliseconds(500);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                cts.CancelAfter(flushInterval);

                try
                {
                    while (await _tickChannel.Reader.WaitToReadAsync(cts.Token))
                    {
                        while (_tickChannel.Reader.TryRead(out var item))
                        {
                            batch.Add(item);
                            if (batch.Count >= 1000) break; // Arbitrary batch size limits
                        }
                        if (batch.Count >= 1000) break;
                    }
                }
                catch (OperationCanceledException)
                {
                    // Time to flush
                }

                if (batch.Any())
                {
                    await FlushBatchAsync(batch);
                    batch.Clear();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in telemetry batch flush");
            }
        }
    }

    private async Task FlushBatchAsync(List<TickItem> batch)
    {
        using var scope = _serviceProvider.CreateScope();
        var influxRepo = scope.ServiceProvider.GetRequiredService<ITelemetryTickRepository>();

        await influxRepo.BatchWriteTicksAsync(batch.Select(b => b.Record).ToList());
    }
}

public class TickItem
{
    /// <summary>Plan of the session owner at ingest time. Kept for diagnostics; storage is no longer partitioned by it.</summary>
    public PlanType Plan { get; set; }
    public TickRecord Record { get; set; } = null!;
}
