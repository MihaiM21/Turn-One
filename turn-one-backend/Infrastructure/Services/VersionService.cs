using Application.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Infrastructure.Services
{
    public class VersionService : IVersionService
    {
        private readonly TurnOneDbContext _dbContext;

        public VersionService(TurnOneDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Domain.Entities.Version> GetCurrentVersionAsync()
        {
            // Get latest version from database
            var version = await _dbContext.Versions
                .OrderByDescending(v => v.Major)
                .ThenByDescending(v => v.Minor)
                .ThenByDescending(v => v.Patch)
                .ThenByDescending(v => v.ReleasedAt)
                .FirstOrDefaultAsync();

            if (version != null)
                return version;

            // If no version exists in database, create default version
            version = new Domain.Entities.Version
            {
                Major = 1,
                Minor = 0,
                Patch = 0,
                ReleasedAt = DateTime.UtcNow,
                ReleaseNotes = "Initial version"
            };
            
            _dbContext.Versions.Add(version);
            await _dbContext.SaveChangesAsync();

            return version;
        }

        public async Task<List<Domain.Entities.Version>> GetVersionHistoryAsync()
        {
            return await _dbContext.Versions
                .OrderByDescending(v => v.Major)
                .ThenByDescending(v => v.Minor)
                .ThenByDescending(v => v.Patch)
                .ToListAsync();
        }

        public async Task<Domain.Entities.Version> UpdateVersionAsync(int major, int minor, int patch, string? preRelease = null, string? buildMetadata = null, string releaseNotes = "")
        {
            var version = new Domain.Entities.Version
            {
                Major = major,
                Minor = minor,
                Patch = patch,
                PreRelease = preRelease,
                BuildMetadata = buildMetadata,
                ReleasedAt = DateTime.UtcNow,
                ReleaseNotes = releaseNotes
            };

            _dbContext.Versions.Add(version);
            await _dbContext.SaveChangesAsync();

            return version;
        }
    }
}