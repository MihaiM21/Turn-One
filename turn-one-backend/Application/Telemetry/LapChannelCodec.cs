using System.Buffers.Binary;
using System.IO.Compression;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Application.Telemetry;

/// <summary>One entry of <c>LapTelemetry.ChannelIndex</c>: where a channel's float32 array sits in the decompressed payload.</summary>
public sealed class ChannelIndexEntry
{
    [JsonPropertyName("k")] public string Key { get; set; } = "";
    [JsonPropertyName("dt")] public string DataType { get; set; } = "f32";
    /// <summary>Byte offset into the decompressed payload.</summary>
    [JsonPropertyName("off")] public int Offset { get; set; }
    /// <summary>Byte length.</summary>
    [JsonPropertyName("len")] public int Length { get; set; }
    /// <summary>True when at least one sample is NaN (absent).</summary>
    [JsonPropertyName("nan")] public bool HasNaN { get; set; }
}

/// <summary>Record-level metadata stored alongside the channel entries (<c>{"meta":{...}}</c>).</summary>
public sealed class LapContainerMeta
{
    /// <summary><c>"legacy"</c> when built from decimated v1 ticks.</summary>
    [JsonPropertyName("q")] public string? Quality { get; set; }
    [JsonPropertyName("gaps")] public int Gaps { get; set; }
    [JsonPropertyName("cov")] public float Coverage { get; set; }
}

public sealed class ChannelIndexDocument
{
    public List<ChannelIndexEntry> Channels { get; set; } = new();
    public LapContainerMeta Meta { get; set; } = new();
}

/// <summary>
/// Codec 1: concatenated little-endian float32 arrays, Brotli-compressed. The channel table is kept
/// outside the blob (jsonb) so it can be queried in SQL and versioned without touching the payload.
/// </summary>
public static class LapChannelCodec
{
    public const short CodecFloat32Brotli = 1;

    private static readonly JsonSerializerOptions Json = new() { DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull };

    public static (byte[] data, string channelIndexJson, int uncompressedBytes) Encode(LapSamples samples, LapContainerMeta? meta = null)
    {
        var entries = new List<ChannelIndexEntry>(samples.Channels.Count);
        var total = samples.Channels.Count * samples.Count * sizeof(float);
        var raw = new byte[total];
        var offset = 0;

        foreach (var key in samples.Channels.Keys.OrderBy(k => k, StringComparer.Ordinal))
        {
            var arr = samples.Channels[key];
            var hasNan = false;
            var span = raw.AsSpan(offset, arr.Length * sizeof(float));
            for (var i = 0; i < arr.Length; i++)
            {
                var v = arr[i];
                if (float.IsNaN(v)) hasNan = true;
                BinaryPrimitives.WriteSingleLittleEndian(span.Slice(i * sizeof(float), sizeof(float)), v);
            }
            entries.Add(new ChannelIndexEntry { Key = key, Offset = offset, Length = span.Length, HasNaN = hasNan });
            offset += span.Length;
        }

        using var output = new MemoryStream();
        using (var brotli = new BrotliStream(output, CompressionLevel.Optimal, leaveOpen: true))
        {
            brotli.Write(raw, 0, offset);
        }

        // JSON array: channel entries followed by one {"meta": {...}} object.
        using var doc = new MemoryStream();
        using (var writer = new Utf8JsonWriter(doc))
        {
            writer.WriteStartArray();
            foreach (var e in entries) JsonSerializer.Serialize(writer, e, Json);
            writer.WriteStartObject();
            writer.WritePropertyName("meta");
            JsonSerializer.Serialize(writer, meta ?? new LapContainerMeta(), Json);
            writer.WriteEndObject();
            writer.WriteEndArray();
        }

        return (output.ToArray(), System.Text.Encoding.UTF8.GetString(doc.ToArray()), offset);
    }

    public static ChannelIndexDocument ParseIndex(string channelIndexJson)
    {
        var result = new ChannelIndexDocument();
        using var doc = JsonDocument.Parse(channelIndexJson);
        foreach (var el in doc.RootElement.EnumerateArray())
        {
            if (el.TryGetProperty("meta", out var meta))
                result.Meta = meta.Deserialize<LapContainerMeta>(Json) ?? new LapContainerMeta();
            else if (el.TryGetProperty("k", out _))
                result.Channels.Add(el.Deserialize<ChannelIndexEntry>(Json)!);
        }
        return result;
    }

    /// <summary>
    /// Decodes the requested channels (all when <paramref name="channels"/> is null), optionally decimating by an
    /// integer factor. Unknown channel names are ignored.
    /// </summary>
    public static LapSamples Decode(byte[] data, string channelIndexJson, float stepM, int sampleCount,
        IEnumerable<string>? channels = null, int decimate = 1)
    {
        var index = ParseIndex(channelIndexJson);
        var wanted = channels?.ToHashSet(StringComparer.Ordinal);
        decimate = Math.Max(1, decimate);

        byte[] raw;
        using (var input = new MemoryStream(data))
        using (var brotli = new BrotliStream(input, CompressionMode.Decompress))
        using (var output = new MemoryStream())
        {
            brotli.CopyTo(output);
            raw = output.ToArray();
        }

        var outCount = decimate == 1 ? sampleCount : (sampleCount + decimate - 1) / decimate;
        var dict = new Dictionary<string, float[]>(StringComparer.Ordinal);
        foreach (var e in index.Channels)
        {
            if (wanted != null && !wanted.Contains(e.Key)) continue;
            if (e.DataType != "f32") continue;
            var n = e.Length / sizeof(float);
            var arr = new float[outCount];
            var span = raw.AsSpan(e.Offset, e.Length);
            for (var i = 0; i < outCount; i++)
            {
                var src = i * decimate;
                arr[i] = src < n ? BinaryPrimitives.ReadSingleLittleEndian(span.Slice(src * sizeof(float), sizeof(float))) : float.NaN;
            }
            dict[e.Key] = arr;
        }

        return new LapSamples(stepM * decimate, outCount, dict);
    }
}
