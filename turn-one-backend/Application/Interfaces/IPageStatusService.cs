namespace Application.Interfaces
{
    using Domain.Entities;
    using System.Collections.Generic;
    using System.Threading.Tasks;

    public interface IPageStatusService
    {
        Task<List<PageStatus>> GetAllPageStatusesAsync();
        Task<PageStatus?> GetPageStatusAsync(string pageName);
        Task<PageStatus> UpdatePageStatusAsync(string pageName, bool isClosed, string maintenanceMessage);
    }
}
