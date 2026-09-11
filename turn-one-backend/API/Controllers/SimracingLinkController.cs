using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

/// <summary>
/// Release metadata for the Turn One Link desktop app, so the download pages can render real
/// version/size/checksum information instead of hardcoding it.
/// </summary>
[ApiController]
[Route("api/simracing/link")]
public class SimracingLinkController : ControllerBase
{
    private readonly IConfiguration _config;

    public SimracingLinkController(IConfiguration config)
    {
        _config = config;
    }

    public class LinkReleaseDto
    {
        /// <summary>False until an installer is actually published; the UI renders a "coming soon" state.</summary>
        public bool Available { get; set; }
        public string? Version { get; set; }
        public DateTime? ReleasedAt { get; set; }
        public string? DownloadUrl { get; set; }
        public string? Sha256 { get; set; }
        public long? SizeBytes { get; set; }
        public string MinWindowsBuild { get; set; } = "Windows 10 (build 19041) or later";
        public List<ChangelogEntry> Changelog { get; set; } = new();
    }

    public class ChangelogEntry
    {
        public string Version { get; set; } = "";
        public DateTime? Date { get; set; }
        public List<string> Changes { get; set; } = new();
    }

    [HttpGet("release")]
    [AllowAnonymous]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
    public ActionResult<LinkReleaseDto> GetRelease()
    {
        var section = _config.GetSection("TurnOneLink");
        var downloadUrl = section["DownloadUrl"];

        var dto = new LinkReleaseDto
        {
            Available = !string.IsNullOrWhiteSpace(downloadUrl),
            Version = section["Version"],
            DownloadUrl = string.IsNullOrWhiteSpace(downloadUrl) ? null : downloadUrl,
            Sha256 = section["Sha256"],
            MinWindowsBuild = section["MinWindowsBuild"] ?? "Windows 10 (build 19041) or later"
        };

        if (DateTime.TryParse(section["ReleasedAt"], out var released))
            dto.ReleasedAt = released.ToUniversalTime();

        if (long.TryParse(section["SizeBytes"], out var size))
            dto.SizeBytes = size;

        dto.Changelog = section.GetSection("Changelog").Get<List<ChangelogEntry>>() ?? new List<ChangelogEntry>();

        return Ok(dto);
    }
}
