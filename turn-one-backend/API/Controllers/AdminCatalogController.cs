using Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static Infrastructure.Services.CatalogAdminService;

namespace API.Controllers;

/// <summary>
/// HCR-008/009 admin Catalog review: provisional track layouts and cars (iRacing ones, mostly) are
/// approved as they are or merged into a curated entry so their laps join that board.
/// </summary>
[ApiController]
[Route("api/simracing/admin/catalog")]
[Authorize(Roles = "ADMIN")]
public class AdminCatalogController : ControllerBase
{
    private readonly CatalogAdminService _admin;

    public AdminCatalogController(CatalogAdminService admin)
    {
        _admin = admin;
    }

    public sealed class ApproveTrackRequest
    {
        public string? Slug { get; set; }
        public string? Name { get; set; }
        public string? Country { get; set; }
        public float? LengthM { get; set; }
    }

    public sealed class ApproveCarRequest
    {
        public string? Slug { get; set; }
        public string? Name { get; set; }
        /// <summary>CarClass slug, e.g. "gt3".</summary>
        public string? Class { get; set; }
    }

    public sealed class MergeRequest
    {
        /// <summary>Slug of the curated layout / car to merge into.</summary>
        public string Into { get; set; } = "";
    }

    /// <summary>Provisional layouts and cars with their sim aliases and how many laps they hold.</summary>
    [HttpGet("provisional")]
    public async Task<IActionResult> Provisional() => Ok(await _admin.GetProvisionalAsync());

    [HttpPost("tracks/{id:guid}/approve")]
    public async Task<IActionResult> ApproveTrack(Guid id, [FromBody] ApproveTrackRequest? body)
    {
        body ??= new ApproveTrackRequest();
        return ToResult(await _admin.ApproveTrackAsync(id, body.Slug, body.Name, body.Country, body.LengthM));
    }

    [HttpPost("cars/{id:guid}/approve")]
    public async Task<IActionResult> ApproveCar(Guid id, [FromBody] ApproveCarRequest? body)
    {
        body ??= new ApproveCarRequest();
        return ToResult(await _admin.ApproveCarAsync(id, body.Slug, body.Name, body.Class));
    }

    [HttpPost("tracks/{id:guid}/merge")]
    public async Task<IActionResult> MergeTrack(Guid id, [FromBody] MergeRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.Into)) return BadRequest(new { message = "into is required." });
        return ToResult(await _admin.MergeTrackAsync(id, body.Into));
    }

    [HttpPost("cars/{id:guid}/merge")]
    public async Task<IActionResult> MergeCar(Guid id, [FromBody] MergeRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.Into)) return BadRequest(new { message = "into is required." });
        return ToResult(await _admin.MergeCarAsync(id, body.Into));
    }

    private IActionResult ToResult(MergeResult r) =>
        r.Outcome == Outcome.Ok ? Ok(new { aliasesMoved = r.AliasesMoved, lapsMoved = r.LapsMoved }) : ToResult(r.Outcome);

    private IActionResult ToResult(Outcome outcome) => outcome switch
    {
        Outcome.Ok => NoContent(),
        Outcome.NotFound => NotFound(new { message = "No such provisional entry." }),
        Outcome.NotProvisional => Conflict(new { message = "Already curated." }),
        Outcome.TargetNotFound => NotFound(new { message = "Merge target not found." }),
        Outcome.TargetNotCurated => BadRequest(new { message = "Merge target must be a curated entry." }),
        Outcome.SameEntry => BadRequest(new { message = "Cannot merge an entry into itself." }),
        Outcome.SlugTaken => Conflict(new { message = "That slug is already used." }),
        Outcome.UnknownClass => BadRequest(new { message = "Unknown car class." }),
        _ => StatusCode(500),
    };
}
