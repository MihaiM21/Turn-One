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
            // Determine environment
            bool isDockerContainer = File.Exists("/.dockerenv") || Directory.Exists("/app");
            
            if (isDockerContainer)
            {
                // In Docker container, use the fixed path
                _versionFilePath = "/app/VERSION";
            }
            else 
            {
                // Development environment - try to find the VERSION file
                // 1. In the application directory
                _versionFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "VERSION");
                
                // 2. If not found, try project root
                if (!File.Exists(_versionFilePath))
                {
                    _versionFilePath = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "VERSION"));
                }
                
                // 3. Try current directory
                if (!File.Exists(_versionFilePath))
                {
                    _versionFilePath = Path.Combine(Directory.GetCurrentDirectory(), "VERSION");
                }
            }
            
            // Log the path being used
            Console.WriteLine($"Using VERSION file at: {_versionFilePath}. Docker container: {isDockerContainer}");
            
            // Initialize version history
            _versionHistory = new List<Domain.Entities.Version>();
        }

        public async Task<Domain.Entities.Version> GetCurrentVersionAsync()
        {
            // Read version from file
            string versionString;
            
            try
            {
                if (!File.Exists(_versionFilePath))
                {
                    Console.WriteLine($"VERSION file not found at: {_versionFilePath}");
                    throw new FileNotFoundException($"VERSION file not found at: {_versionFilePath}");
                }
                
                versionString = await File.ReadAllTextAsync(_versionFilePath);
                Console.WriteLine($"Successfully read version: {versionString.Trim()} from {_versionFilePath}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error reading VERSION file: {ex.Message}");
                
                // If file doesn't exist or can't be read, create default version
                var defaultVersion = new Domain.Entities.Version
                {
                    Major = 1,
                    Minor = 0,
                    Patch = 0,
                    ReleasedAt = DateTime.UtcNow,
                    ReleaseNotes = "Initial version (VERSION file not found)"
                };
                
                try 
                {
                    // Try to create the default VERSION file
                    string? directory = Path.GetDirectoryName(_versionFilePath);
                    if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
                    {
                        Directory.CreateDirectory(directory);
                    }
                    
                    await File.WriteAllTextAsync(_versionFilePath, defaultVersion.VersionString);
                    Console.WriteLine($"Created default VERSION file at: {_versionFilePath}");
                }
                catch (Exception writeEx)
                {
                    Console.WriteLine($"Failed to create default VERSION file: {writeEx.Message}");
                }
                
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