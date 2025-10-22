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
        private readonly string _versionFilePath;
        private readonly List<Domain.Entities.Version> _versionHistory;

        public VersionService()
        {
            // Get the path to the VERSION file in the turnonebackend root directory
            _versionFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "VERSION");
            
            // If running in development, adjust path to find VERSION file in the project root
            if (!File.Exists(_versionFilePath))
            {
                _versionFilePath = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "VERSION"));
            }
            
            // Initialize version history
            _versionHistory = new List<Domain.Entities.Version>();
        }

        public async Task<Domain.Entities.Version> GetCurrentVersionAsync()
        {
            // Read version from file
            string versionString;
            
            try
            {
                versionString = await File.ReadAllTextAsync(_versionFilePath);
            }
            catch (Exception)
            {
                // If file doesn't exist or can't be read, create default version
                var defaultVersion = new Domain.Entities.Version
                {
                    Major = 1,
                    Minor = 0,
                    Patch = 0,
                    ReleasedAt = DateTime.UtcNow,
                    ReleaseNotes = "Initial version"
                };
                
                await File.WriteAllTextAsync(_versionFilePath, defaultVersion.VersionString);
                return defaultVersion;
            }
            
            // Parse the version string
            return Domain.Entities.Version.Parse(versionString.Trim());
        }

        public async Task<List<Domain.Entities.Version>> GetVersionHistoryAsync()
        {
            // Since we're only storing the current version in the file,
            // we'll return a list with just the current version
            var currentVersion = await GetCurrentVersionAsync();
            return new List<Domain.Entities.Version> { currentVersion };
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

            // Write the version string to the file
            await File.WriteAllTextAsync(_versionFilePath, version.VersionString);

            return version;
        }
    }
}