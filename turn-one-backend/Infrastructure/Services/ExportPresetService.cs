using System.Text.Json;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services
{
    public class ExportPresetService : IExportPresetService
    {
        private readonly TurnOneDbContext _context;

        public ExportPresetService(TurnOneDbContext context)
        {
            _context = context;
        }

        public async Task<List<ExportPresetDto>> GetPresetsAsync(string? sessionType = null)
        {
            var query = _context.ExportPresets.Include(p => p.CreatedBy).AsQueryable();

            if (!string.IsNullOrWhiteSpace(sessionType) &&
                Enum.TryParse<SessionType>(sessionType, true, out var st))
            {
                query = query.Where(p => p.SessionType == st);
            }

            var presets = await query
                .OrderByDescending(p => p.UpdatedAt)
                .ToListAsync();

            return presets.Select(ToDto).ToList();
        }

        public async Task<ExportPresetDto?> GetPresetAsync(Guid id)
        {
            var preset = await _context.ExportPresets
                .Include(p => p.CreatedBy)
                .FirstOrDefaultAsync(p => p.Id == id);
            return preset == null ? null : ToDto(preset);
        }

        public async Task<ExportPresetDto> CreatePresetAsync(Guid createdByUserId, CreateExportPresetDto dto)
        {
            var sessionType = Enum.Parse<SessionType>(dto.SessionType, true);
            var now = DateTime.UtcNow;
            var preset = new ExportPreset
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                SessionType = sessionType,
                ChartKeys = JsonSerializer.Serialize(dto.ChartKeys),
                OutputSizes = JsonSerializer.Serialize(dto.OutputSizes),
                CreatedByUserId = createdByUserId,
                CreatedAt = now,
                UpdatedAt = now
            };

            await _context.ExportPresets.AddAsync(preset);
            await _context.SaveChangesAsync();

            await _context.Entry(preset).Reference(p => p.CreatedBy).LoadAsync();
            return ToDto(preset);
        }

        public async Task<ExportPresetDto?> UpdatePresetAsync(Guid id, UpdateExportPresetDto dto)
        {
            var preset = await _context.ExportPresets
                .Include(p => p.CreatedBy)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (preset == null) return null;

            if (!string.IsNullOrWhiteSpace(dto.Name)) preset.Name = dto.Name;
            if (!string.IsNullOrWhiteSpace(dto.SessionType) &&
                Enum.TryParse<SessionType>(dto.SessionType, true, out var st))
            {
                preset.SessionType = st;
            }
            if (dto.ChartKeys != null) preset.ChartKeys = JsonSerializer.Serialize(dto.ChartKeys);
            if (dto.OutputSizes != null) preset.OutputSizes = JsonSerializer.Serialize(dto.OutputSizes);
            preset.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return ToDto(preset);
        }

        public async Task<bool> DeletePresetAsync(Guid id)
        {
            var preset = await _context.ExportPresets.FindAsync(id);
            if (preset == null) return false;
            _context.ExportPresets.Remove(preset);
            await _context.SaveChangesAsync();
            return true;
        }

        private static ExportPresetDto ToDto(ExportPreset preset) => new()
        {
            Id = preset.Id,
            Name = preset.Name,
            SessionType = preset.SessionType.ToString(),
            ChartKeys = SafeDeserialize(preset.ChartKeys),
            OutputSizes = SafeDeserialize(preset.OutputSizes),
            CreatedAt = preset.CreatedAt,
            UpdatedAt = preset.UpdatedAt,
            CreatedByUsername = preset.CreatedBy?.Username ?? "Admin"
        };

        private static List<string> SafeDeserialize(string json)
        {
            if (string.IsNullOrWhiteSpace(json)) return new List<string>();
            try { return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>(); }
            catch { return new List<string>(); }
        }
    }
}
