using Application.DTOs;

namespace Application.Interfaces;

/// <summary>Enqueues lap reprocessing jobs and reports their progress. See <c>LapReprocessWorker</c> for execution.</summary>
public interface ILapReprocessService
{
    /// <summary>
    /// Enqueues a reprocess job and returns its id immediately; work happens on the background worker.
    /// </summary>
    /// <param name="restrictToUser">
    /// When set, only sessions owned by this user are eligible — used by the caller-facing
    /// <c>POST sessions/{id}/reprocess</c> endpoints so a non-admin can't reprocess someone else's data.
    /// </param>
    Guid Enqueue(ReprocessRequestDto req, Guid? restrictToUser);

    ReprocessStatusDto? GetStatus(Guid jobId);
}
