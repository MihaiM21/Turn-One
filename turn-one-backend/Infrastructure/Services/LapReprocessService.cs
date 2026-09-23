using System.Threading.Channels;
using Application.DTOs;
using Application.Interfaces;

namespace Infrastructure.Services;

/// <summary>One queued reprocess request, as handed to <c>LapReprocessWorker</c>.</summary>
public sealed record ReprocessJob(Guid JobId, ReprocessRequestDto Request, Guid? RestrictToUser);

/// <summary>
/// Enqueues reprocess jobs onto the shared channel and records their initial status. All the actual
/// work (resolving sessions, pulling ticks, calling <see cref="ILapProcessor"/>) happens on
/// <c>LapReprocessWorker</c>; this type is intentionally thin so the controller call returns instantly.
/// </summary>
public class LapReprocessService : ILapReprocessService
{
    private readonly Channel<ReprocessJob> _channel;
    private readonly LapReprocessJobStore _store;

    public LapReprocessService(Channel<ReprocessJob> channel, LapReprocessJobStore store)
    {
        _channel = channel;
        _store = store;
    }

    public Guid Enqueue(ReprocessRequestDto req, Guid? restrictToUser)
    {
        var jobId = Guid.NewGuid();
        // Total session count isn't known until the worker resolves the filter; 0 is a placeholder it updates.
        _store.Create(jobId, sessionsTotal: 0);
        if (!_channel.Writer.TryWrite(new ReprocessJob(jobId, req, restrictToUser)))
        {
            _store.Update(jobId, s =>
            {
                s.State = "Failed";
                s.LastError = "Reprocess queue is full";
                s.FinishedAt = DateTime.UtcNow;
            });
        }
        return jobId;
    }

    public ReprocessStatusDto? GetStatus(Guid jobId) => _store.Get(jobId);
}
