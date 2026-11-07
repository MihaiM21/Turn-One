using System.Text;
using System.Text.Json;
using Application.Telemetry;

namespace API.Services;

/// <summary>An uploaded lap after parsing (HCR-007).</summary>
public sealed class ParsedLapUpload
{
    public required Guid SessionId { get; init; }
    public required JsonElement SessionStart { get; init; }
    public required long SessionStartTimestamp { get; init; }
    public required LapCompleteInfo Complete { get; init; }
    /// <summary>Ticks of the completed lap only, in time order.</summary>
    public required IReadOnlyList<TickV2> Ticks { get; init; }
    public string? SetupHash { get; init; }
}

/// <summary>
/// Parses the HCR-007 upload body: NDJSON of the same v2 envelopes the live socket carries —
/// <c>session_start</c> first, the lap's <c>tick</c>s (plus a little before/after), <c>lap_complete</c>,
/// optionally <c>setup_ref</c>. Pure, so the contract is unit-tested without HTTP.
/// </summary>
public static class LapUploadParser
{
    public sealed class UploadFormatException(string message) : Exception(message);

    public static ParsedLapUpload Parse(ReadOnlySpan<byte> utf8Body)
    {
        Guid? sessionId = null;
        JsonElement? sessionStart = null;
        long sessionStartTs = 0;
        LapCompleteInfo? complete = null;
        string? setupHash = null;
        var ticks = new List<TickV2>();

        var text = Encoding.UTF8.GetString(utf8Body);
        int lineNo = 0;
        foreach (var raw in text.Split('\n'))
        {
            lineNo++;
            var line = raw.Trim();
            if (line.Length == 0) continue;

            JsonElement root;
            try
            {
                using var doc = JsonDocument.Parse(line);
                root = doc.RootElement.Clone();
            }
            catch (JsonException)
            {
                throw new UploadFormatException($"Line {lineNo} is not JSON.");
            }

            if (root.TryGetProperty("v", out var v) && v.ValueKind == JsonValueKind.Number && v.GetInt32() != 2)
                throw new UploadFormatException($"Line {lineNo}: only protocol v2 frames can be uploaded.");

            var type = root.TryGetProperty("type", out var t) ? t.GetString() : null;
            var ts = root.TryGetProperty("timestamp", out var tsp) && tsp.ValueKind == JsonValueKind.Number ? tsp.GetInt64() : 0;
            var data = root.TryGetProperty("data", out var d) ? d : default;

            if (root.TryGetProperty("sessionId", out var sid) && sid.ValueKind == JsonValueKind.String)
            {
                if (!Guid.TryParseExact(sid.GetString(), "N", out var parsed))
                    throw new UploadFormatException($"Line {lineNo}: sessionId must be 32 hex characters.");
                if (sessionId is { } known && known != parsed)
                    throw new UploadFormatException("All frames must belong to the same session.");
                sessionId = parsed;
            }

            switch (type)
            {
                case "session_start":
                    sessionStart = data;
                    sessionStartTs = ts;
                    break;
                case "tick":
                    ticks.Add(TickV2.FromJson(ts, data));
                    break;
                case "lap_complete":
                    complete = TelemetryIngestionService.ParseLapCompleteInfo(data);
                    break;
                case "setup_ref":
                    setupHash = data.ValueKind == JsonValueKind.Object && data.TryGetProperty("hash", out var h) ? h.GetString() : null;
                    break;
                default:
                    // Unknown frame types are ignored, as on the live socket.
                    break;
            }
        }

        if (sessionId is not { } id) throw new UploadFormatException("No sessionId.");
        if (sessionStart is not { } start) throw new UploadFormatException("The first frame must be session_start.");
        if (complete is not { } lap || lap.Lap <= 0) throw new UploadFormatException("No lap_complete with a lap number.");

        // Only the completed lap's own ticks; the extra seconds before/after belong to other laps.
        var lapTicks = ticks.Where(x => x.Lap == lap.Lap).OrderBy(x => x.T).ToList();
        if (lapTicks.Count < 2) throw new UploadFormatException($"Lap {lap.Lap} has no ticks.");

        return new ParsedLapUpload
        {
            SessionId = id,
            SessionStart = start,
            SessionStartTimestamp = sessionStartTs,
            Complete = lap,
            Ticks = lapTicks,
            SetupHash = setupHash,
        };
    }
}
