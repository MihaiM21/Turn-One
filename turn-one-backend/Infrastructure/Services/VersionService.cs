using Application.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace Infrastructure.Services
{
    public class VersionService : IVersionService
    {
        private readonly TurnOneDbContext _dbContext;
        private readonly string _versionFilePath;

        public VersionService(TurnOneDbContext dbContext)
        {
            _dbContext = dbContext;
            _versionFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "VERSION");
        }

        public async Task<Domain.Entities.Version> GetCurrentVersionAsync()
        {
            // Try to get from database first
            var version = await _dbContext.Versions
                .OrderByDescending(v => v.Major)
                .ThenByDescending(v => v.Minor)
                .ThenByDescending(v => v.Patch)
                .FirstOrDefaultAsync();

            if (version != null)
                return version;

            // If not in database, read from file
            if (File.Exists(_versionFilePath))
            {
                string versionString = await File.ReadAllTextAsync(_versionFilePath);
                version = Domain.Entities.Version.Parse(versionString.Trim());
                version.ReleasedAt = DateTime.UtcNow;

                // Store in database
                _dbContext.Versions.Add(version);
                await _dbContext.SaveChangesAsync();
            }
            else
            {
                // Create default version
                version = new Domain.Entities.Version
                {
                    Major = 1,
                    Minor = 0,
                    Patch = 0,
                    ReleasedAt = DateTime.UtcNow
                };
                
                _dbContext.Versions.Add(version);
                await _dbContext.SaveChangesAsync();
                
                // Update the version file
                await File.WriteAllTextAsync(_versionFilePath, version.VersionString);
            }

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

            // Update the version file
            await File.WriteAllTextAsync(_versionFilePath, version.VersionString);

            return version;
        }
    }
}