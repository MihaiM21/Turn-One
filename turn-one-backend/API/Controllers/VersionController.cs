using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VersionController : ControllerBase
    {
        private readonly IVersionService _versionService;

        public VersionController(IVersionService versionService)
        {
            _versionService = versionService;
        }

        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentVersion()
        {
            var version = await _versionService.GetCurrentVersionAsync();
            return Ok(new { 
                version = version.VersionString,
                major = version.Major,
                minor = version.Minor,
                patch = version.Patch,
                preRelease = version.PreRelease,
                buildMetadata = version.BuildMetadata,
                releasedAt = version.ReleasedAt,
                releaseNotes = version.ReleaseNotes
            });
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetVersionHistory()
        {
            var versions = await _versionService.GetVersionHistoryAsync();
            
            return Ok(versions.Select(v => new {
                version = v.VersionString,
                major = v.Major,
                minor = v.Minor,
                patch = v.Patch,
                preRelease = v.PreRelease,
                buildMetadata = v.BuildMetadata,
                releasedAt = v.ReleasedAt,
                releaseNotes = v.ReleaseNotes
            }));
        }

        // Called by scripts/update-version.{sh,ps1}, which already send
        // "Authorization: Bearer $API_TOKEN" — that token must belong to an admin.
        [Authorize(Roles = "ADMIN")]
        [HttpPost("update")]
        public async Task<IActionResult> UpdateVersion([FromBody] UpdateVersionRequest request)
        {
            var version = await _versionService.UpdateVersionAsync(
                request.Major,
                request.Minor,
                request.Patch,
                request.PreRelease,
                request.BuildMetadata,
                request.ReleaseNotes
            );
            
            return Ok(new { 
                version = version.VersionString,
                major = version.Major,
                minor = version.Minor,
                patch = version.Patch,
                preRelease = version.PreRelease,
                buildMetadata = version.BuildMetadata,
                releasedAt = version.ReleasedAt,
                releaseNotes = version.ReleaseNotes
            });
        }
    }

    public class UpdateVersionRequest
    {
        public int Major { get; set; }
        public int Minor { get; set; }
        public int Patch { get; set; }
        public string? PreRelease { get; set; }
        public string? BuildMetadata { get; set; }
        public string ReleaseNotes { get; set; } = string.Empty;
    }
}