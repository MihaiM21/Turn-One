using Domain.Entities;

namespace Application.Interfaces;

public interface IPageStatusService
{
    Task<IEnumerable<PageStatus>> GetAllPageStatusesAsync();
    Task<PageStatus> GetPageStatusAsync(string pageSlug);
    Task<PageStatus> SetPageStatusAsync(string pageSlug, bool isDisabled, string? maintenanceMessage, string updatedByUsername);
}
