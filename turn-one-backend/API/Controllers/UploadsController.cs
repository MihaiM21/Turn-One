using System.IO.Compression;
using System.Security.Claims;
using API.Security;
using API.Services;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace API.Controllers;

/// <summary>
/// HCR-007 — lap / session upload for Turn One Link's local-first recording. Accepts user tokens and
/// Link device tokens (<c>scope=link</c>).
/// </summary>
[ApiController]
[Route("api/simracing/uploads")]
[Authorize]
public class UploadsController : ControllerBase
{
    public const int MaxCompressedBytes = 8 * 1024 * 1024;
    public const int MaxUncompressedBytes = 64 * 1024 * 1024;

    private readonly LapUploadService _uploads;

    public UploadsController(LapUploadService uploads)
    {
        _uploads = uploads;
    }

    public sealed class EndSessionRequest
    {
        public EndFrame? End { get; set; }
        public List<ClientLap> Laps { get; set; } = new();

        public sealed class EndFrame
        {
            public long? EndedAt { get; set; }
            public int LapsCompleted { get; set; }
            public int BestLapMs { get; set; }
        }

        public sealed class ClientLap
        {
            public int LapNumber { get; set; }
            public string? Sha256 { get; set; }
        }
    }

    [HttpPost("laps")]
    [RequestSizeLimit(MaxCompressedBytes)]
    [EnableRateLimiting(RateLimits.Uploads)]
    public async Task<IActionResult> UploadLap()
    {
        if (!TryGetUser(out var userId, out var plan, out var deviceId)) return Unauthorized();

        byte[] body;
        try
        {
            body = await ReadBodyAsync(Request);
        }
        catch (InvalidDataException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        var key = Request.Headers["Idempotency-Key"].ToString();
        var result = await _uploads.UploadLapAsync(userId, plan, deviceId, key, body);

        return result.Outcome switch
        {
            LapUploadOutcome.Queued => Accepted(new { uploadId = result.UploadId, lap = result.LapNumber, status = "queued" }),
            LapUploadOutcome.Duplicate => Ok(new { uploadId = result.UploadId, lap = result.LapNumber, status = "duplicate" }),
            LapUploadOutcome.Conflict => Conflict(new { message = result.Error }),
            LapUploadOutcome.QueueFull => StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = result.Error }),
            _ => UnprocessableEntity(new { message = result.Error }),
        };
    }

    [HttpPost("sessions/{sessionId}/end")]
    [EnableRateLimiting(RateLimits.Uploads)]
    public async Task<IActionResult> EndSession(string sessionId, [FromBody] EndSessionRequest body)
    {
        if (!TryGetUser(out var userId, out _, out _)) return Unauthorized();
        if (!Guid.TryParseExact(sessionId, "N", out var id) && !Guid.TryParse(sessionId, out id))
            return BadRequest(new { message = "sessionId must be a GUID." });

        var endedAt = body.End?.EndedAt is { } ms ? DateTimeOffset.FromUnixTimeMilliseconds(ms).UtcDateTime : DateTime.UtcNow;
        var (outcome, missing) = await _uploads.EndSessionAsync(
            userId, id, endedAt, body.End?.LapsCompleted ?? 0, body.End?.BestLapMs ?? 0,
            body.Laps.Select(l => l.LapNumber).ToList());

        return outcome switch
        {
            LapUploadOutcome.Conflict => Conflict(new { message = "This session belongs to another account." }),
            LapUploadOutcome.Invalid => NotFound(),
            _ => Ok(new { missing }),
        };
    }

    [HttpGet("sessions/{sessionId}")]
    public async Task<IActionResult> GetSession(string sessionId)
    {
        if (!TryGetUser(out var userId, out _, out _)) return Unauthorized();
        if (!Guid.TryParseExact(sessionId, "N", out var id) && !Guid.TryParse(sessionId, out id))
            return BadRequest(new { message = "sessionId must be a GUID." });

        var laps = await _uploads.GetStatusAsync(userId, id);
        return laps == null ? NotFound() : Ok(new { sessionId = id.ToString("N"), laps });
    }

    /// <summary>Reads the body, inflating Brotli/gzip with a hard cap so a small upload can't expand without limit.</summary>
    public static async Task<byte[]> ReadBodyAsync(HttpRequest request)
    {
        var encoding = request.Headers.ContentEncoding.ToString().Trim().ToLowerInvariant();
        Stream source = encoding switch
        {
            "br" => new BrotliStream(request.Body, CompressionMode.Decompress, leaveOpen: true),
            "gzip" => new GZipStream(request.Body, CompressionMode.Decompress, leaveOpen: true),
            "" or "identity" => request.Body,
            _ => throw new InvalidDataException($"Unsupported Content-Encoding '{encoding}'."),
        };

        await using (source.ConfigureAwait(false))
        {
            using var buffer = new MemoryStream();
            var chunk = new byte[81920];
            int read;
            while ((read = await source.ReadAsync(chunk)) > 0)
            {
                if (buffer.Length + read > MaxUncompressedBytes)
                    throw new InvalidDataException("Upload is too large once decompressed.");
                buffer.Write(chunk, 0, read);
            }
            return buffer.ToArray();
        }
    }

    private bool TryGetUser(out Guid userId, out PlanType plan, out Guid? deviceId)
    {
        deviceId = Guid.TryParse(User.FindFirstValue("DeviceId"), out var d) ? d : null;
        plan = Enum.TryParse<PlanType>(User.FindFirstValue("Plan"), out var p) ? p : PlanType.BASIC;
        return Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);
    }
}
