using Application.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

/// <summary>
/// The known manageable page slugs. Used for GetAllPageStatusesAsync to always return
/// a complete list even before any row exists in the database.
/// </summary>
public static class ManagedPages
{
    public static readonly IReadOnlyList<string> Slugs = new[]
    {
        "live",
        "generator",
        "predictions",
        "simracing",
    };
}

public class PageStatusService : IPageStatusService
{
    private readonly TurnOneDbContext _context;

    public PageStatusService(TurnOneDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PageStatus>> GetAllPageStatusesAsync()
    {
        var dbRows = await _context.PageStatuses.ToListAsync();
        var dbMap = dbRows.ToDictionary(r => r.PageSlug, r => r);

        // Ensure every managed slug is represented, even if not yet in the DB
        return ManagedPages.Slugs.Select(slug =>
            dbMap.TryGetValue(slug, out var row)
                ? row
                : new PageStatus { PageSlug = slug, IsDisabled = false });
    }

    public async Task<PageStatus> GetPageStatusAsync(string pageSlug)
    {
        var existing = await _context.PageStatuses
            .FirstOrDefaultAsync(p => p.PageSlug == pageSlug);

        if (existing != null)
            return existing;

        // Return an in-memory default — no DB write on GET
        return new PageStatus { PageSlug = pageSlug, IsDisabled = false };
    }

    public async Task<PageStatus> SetPageStatusAsync(
        string pageSlug,
        bool isDisabled,
        string? maintenanceMessage,
        string updatedByUsername)
    {
        var existing = await _context.PageStatuses
            .FirstOrDefaultAsync(p => p.PageSlug == pageSlug);

        if (existing == null)
        {
            existing = new PageStatus { PageSlug = pageSlug };
            _context.PageStatuses.Add(existing);
        }

        existing.IsDisabled = isDisabled;
        existing.MaintenanceMessage = maintenanceMessage;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedByUsername = updatedByUsername;

        await _context.SaveChangesAsync();
        return existing;
    }
}
