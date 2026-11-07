using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

/// <summary>
/// Release metadata for the Turn One Link desktop app, so the download pages can render real
/// version/size/checksum information instead of hardcoding it, plus the release channels and
/// minimum versions Link checks at startup (HCR-014).
/// </summary>
[ApiController]
[Route("api/simracing/link")]
public class SimracingLinkController : ControllerBase
{
    private const string DefaultFeedUrl = "https://github.com/MihaiM21/Turn-One-Link";

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

        // HCR-014 additions (absent from older clients' expectations, so purely additive).
        public string Channel { get; set; } = "stable";
        public string? MinSupportedVersion { get; set; }
        public string VelopackFeedUrl { get; set; } = DefaultFeedUrl;
    }

    public class ChangelogEntry
    {
        public string Version { get; set; } = "";
        public DateTime? Date { get; set; }
        public List<string> Changes { get; set; } = new();
    }

    public class CompatDto
    {
        public bool Supported { get; set; }
        public bool UploadsAccepted { get; set; }
        public string? LatestVersion { get; set; }
        public string? Message { get; set; }
    }

    /// <summary>
    /// Stable comes from the flat <c>TurnOneLink</c> keys (as before) or <c>TurnOneLink:Channels:stable</c>;
    /// beta from <c>TurnOneLink:Channels:beta</c>, falling back to stable when no beta is configured.
    /// </summary>
    [HttpGet("release")]
    [AllowAnonymous]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
    public ActionResult<LinkReleaseDto> GetRelease([FromQuery] string? channel = null)
    {
        var root = _config.GetSection("TurnOneLink");
        var wantBeta = string.Equals(channel, "beta", StringComparison.OrdinalIgnoreCase);

        var beta = root.GetSection("Channels:beta");
        var stable = root.GetSection("Channels:stable");
        var (section, resolved) = wantBeta && beta.Exists()
            ? (beta, "beta")
            : (stable.Exists() ? stable : root, "stable");

        var downloadUrl = section["DownloadUrl"];

        var dto = new LinkReleaseDto
        {
            Available = !string.IsNullOrWhiteSpace(downloadUrl),
            Version = section["Version"],
            DownloadUrl = string.IsNullOrWhiteSpace(downloadUrl) ? null : downloadUrl,
            Sha256 = section["Sha256"],
            MinWindowsBuild = root["MinWindowsBuild"] ?? "Windows 10 (build 19041) or later",
            Channel = resolved,
            MinSupportedVersion = root["MinSupportedVersion"],
            VelopackFeedUrl = root["VelopackFeedUrl"] ?? DefaultFeedUrl,
        };

        if (DateTime.TryParse(section["ReleasedAt"], out var released))
            dto.ReleasedAt = released.ToUniversalTime();

        if (long.TryParse(section["SizeBytes"], out var size))
            dto.SizeBytes = size;

        dto.Changelog = root.GetSection("Changelog").Get<List<ChangelogEntry>>() ?? new List<ChangelogEntry>();

        return Ok(dto);
    }

    /// <summary>Whether a Link build may still run and upload. Link calls this at startup.</summary>
    [HttpGet("compat")]
    [AllowAnonymous]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
    public ActionResult<CompatDto> Compat([FromQuery] string? version)
    {
        if (!TryParseVersion(version, out var current))
            return BadRequest(new { message = "version must look like 1.2.3" });

        var root = _config.GetSection("TurnOneLink");
        var supported = IsAtLeast(current, root["MinSupportedVersion"]);
        var uploads = supported && IsAtLeast(current, root["MinUploadVersion"]);
        var latest = root.GetSection("Channels:stable")["Version"] ?? root["Version"];

        return Ok(new CompatDto
        {
            Supported = supported,
            UploadsAccepted = uploads,
            LatestVersion = latest,
            Message = !supported
                ? "This version of Turn One Link is no longer supported. Please update."
                : !uploads
                    ? "Update Turn One Link to keep uploading laps — this version has a known timing bug."
                    : null,
        });
    }

    /// <summary>True when <paramref name="minimum"/> is unset or <paramref name="current"/> is at least it.</summary>
    public static bool IsAtLeast(Version current, string? minimum) =>
        !TryParseVersion(minimum, out var min) || current >= min;

    /// <summary>Accepts "1.2", "1.2.3", "v1.2.3" and "1.2.3-beta" (pre-release suffix ignored).</summary>
    public static bool TryParseVersion(string? value, out Version version)
    {
        version = new Version(0, 0);
        if (string.IsNullOrWhiteSpace(value)) return false;
        var core = value.Trim().TrimStart('v', 'V').Split('-', '+')[0];
        if (!Version.TryParse(core, out var parsed)) return false;
        version = parsed;
        return true;
    }
}
