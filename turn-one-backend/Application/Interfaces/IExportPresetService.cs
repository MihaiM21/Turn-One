using Application.DTOs;

namespace Application.Interfaces
{
    public interface IExportPresetService
    {
        Task<List<ExportPresetDto>> GetPresetsAsync(string? sessionType = null);
        Task<ExportPresetDto?> GetPresetAsync(Guid id);
        Task<ExportPresetDto> CreatePresetAsync(Guid createdByUserId, CreateExportPresetDto dto);
        Task<ExportPresetDto?> UpdatePresetAsync(Guid id, UpdateExportPresetDto dto);
        Task<bool> DeletePresetAsync(Guid id);
    }
}
