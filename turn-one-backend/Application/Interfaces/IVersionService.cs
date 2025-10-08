using Domain.Entities;

namespace Application.Interfaces
{
    public interface IVersionService
    {
        Task<Domain.Entities.Version> GetCurrentVersionAsync();
        Task<List<Domain.Entities.Version>> GetVersionHistoryAsync();
        Task<Domain.Entities.Version> UpdateVersionAsync(int major, int minor, int patch, string? preRelease = null, string? buildMetadata = null, string releaseNotes = "");
    }
}