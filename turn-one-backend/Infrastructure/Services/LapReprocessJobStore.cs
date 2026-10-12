using System.Collections.Concurrent;
using Application.DTOs;

namespace Infrastructure.Services;

/// <summary>
/// In-memory status board for reprocess jobs. Singleton so both the enqueuing service and the
/// background worker (and the status-lookup endpoint) share the same view. Not persisted — a restart
/// loses history, which is fine for an operational backfill tool.
/// </summary>
public sealed class LapReprocessJobStore
{
    private const int MaxKept = 100;

    private readonly ConcurrentDictionary<Guid, ReprocessStatusDto> _jobs = new();
    private readonly ConcurrentQueue<Guid> _order = new();
    private readonly object _evictLock = new();

    public ReprocessStatusDto Create(Guid jobId, int sessionsTotal)
    {
        var status = new ReprocessStatusDto
        {
            JobId = jobId,
            State = "Queued",
            SessionsTotal = sessionsTotal,
            StartedAt = DateTime.UtcNow,
        };
        _jobs[jobId] = status;
        _order.Enqueue(jobId);
        Evict();
        return status;
    }

    public ReprocessStatusDto? Get(Guid jobId) => _jobs.TryGetValue(jobId, out var s) ? s : null;

    public void Update(Guid jobId, Action<ReprocessStatusDto> mutate)
    {
        if (_jobs.TryGetValue(jobId, out var status)) mutate(status);
    }

    private void Evict()
    {
        if (_jobs.Count <= MaxKept) return;
        lock (_evictLock)
        {
            while (_jobs.Count > MaxKept && _order.TryDequeue(out var oldest))
                _jobs.TryRemove(oldest, out _);
        }
    }
}
