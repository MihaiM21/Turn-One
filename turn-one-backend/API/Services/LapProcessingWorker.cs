using API.Hubs;
using Application.Interfaces;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Channels;

namespace API.Services;

/// <summary>
/// Drains the <c>Channel&lt;LapJob&gt;</c> that <see cref="TelemetryIngestionService"/> writes lap-cut
/// buffers to, gives a just-cut lap a short grace period for its <c>lap_complete</c> frame to arrive
/// (which enriches sim-authoritative timing), then hands it to <see cref="ILapProcessor"/> and pushes a
/// <c>LapProcessed</c> SignalR event. See <c>docs/architecture/sim-telemetry-protocol-v2.md</c> §6 and
/// Task C3 in the ingestion work item.
/// </summary>
public class LapProcessingWorker : BackgroundService
{
    private static readonly TimeSpan CompleteGracePeriod = TimeSpan.FromSeconds(3);
    private static readonly TimeSpan PollInterval = TimeSpan.FromMilliseconds(100);

    private readonly Channel<LapJob> _channel;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly TelemetryIngestionService _ingestionService;
    private readonly IHubContext<SimTelemetryHub> _hubContext;
    private readonly ILogger<LapProcessingWorker> _logger;

    public LapProcessingWorker(
        Channel<LapJob> channel,
        IServiceScopeFactory scopeFactory,
        TelemetryIngestionService ingestionService,
        IHubContext<SimTelemetryHub> hubContext,
        ILogger<LapProcessingWorker> logger)
    {
        _channel = channel;
        _scopeFactory = scopeFactory;
        _ingestionService = ingestionService;
        _hubContext = hubContext;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Lap Processing Worker started");

        while (!stoppingToken.IsCancellationRequested)
        {
            LapJob? job = null;
            try
            {
                job = await _channel.Reader.ReadAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            try
            {
                await ProcessJobAsync(job, stoppingToken);
            }
            catch (Exception ex)
            {
                // Never let a single bad job kill the loop.
                _logger.LogError(ex, "Unhandled error processing lap {Lap} for session {SessionId}", job.LapNumber, job.Track.SessionId);
                _ingestionService.RemovePendingJob(job.Track.SessionId, job.LapNumber);
            }
        }
    }

    private async Task ProcessJobAsync(LapJob job, CancellationToken ct)
    {
        if (job.Complete == null && job.SkipReason == null)
            await WaitForCompleteAsync(job, ct);

        using var scope = _scopeFactory.CreateScope();
        var processor = scope.ServiceProvider.GetRequiredService<ILapProcessor>();

        LapProcessResult result;
        try
        {
            result = await processor.ProcessAsync(job, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lap processor threw for session {SessionId} lap {Lap}", job.Track.SessionId, job.LapNumber);
            job.Completion?.TrySetException(ex);
            return;
        }
        finally
        {
            _ingestionService.RemovePendingJob(job.Track.SessionId, job.LapNumber);
        }

        job.Completion?.TrySetResult(result);

        try
        {
            await _hubContext.Clients.Group($"telemetry_{job.Track.UserId}").SendAsync("LapProcessed", new
            {
                sessionId = job.Track.SessionId,
                lapNumber = job.LapNumber,
                lapId = result.LapId,
                isValid = result.IsValid,
                lapTimeMs = result.LapTimeMs,
                cornerCount = result.CornerCount
            }, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to push LapProcessed for session {SessionId} lap {Lap}", job.Track.SessionId, job.LapNumber);
        }
    }

    private static async Task WaitForCompleteAsync(LapJob job, CancellationToken ct)
    {
        var deadline = DateTime.UtcNow + CompleteGracePeriod;
        while (job.Complete == null && DateTime.UtcNow < deadline && !ct.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(PollInterval, ct);
            }
            catch (OperationCanceledException)
            {
                return;
            }
        }
    }
}
