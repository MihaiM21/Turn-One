using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// The processed, distance-indexed telemetry of one lap: every channel resampled onto a fixed
/// <see cref="StepM"/> grid and stored as concatenated little-endian float32 arrays, Brotli-compressed.
/// One row per <see cref="TelemetryLap"/>. This is what overlays, corner analysis and the API read;
/// the raw ticks in InfluxDB are only an archive for reprocessing.
/// </summary>
public class LapTelemetry
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid TelemetryLapId { get; set; }

    [ForeignKey("TelemetryLapId")]
    public TelemetryLap Lap { get; set; } = null!;

    /// <summary>Denormalised for bulk deletes / per-session queries.</summary>
    public Guid SessionId { get; set; }

    /// <summary>Grid spacing, metres (2.0).</summary>
    public float StepM { get; set; }

    public int SampleCount { get; set; }

    /// <summary>1 = float32 LE arrays + Brotli. Reserved 2 = int16 fixed-point + delta.</summary>
    public short Codec { get; set; } = 1;

    public DistanceSource DistanceSource { get; set; }

    /// <summary>
    /// JSON array describing the channel layout inside the decompressed payload, in write order:
    /// <c>[{"k":"speed","dt":"f32","off":0,"len":14008,"nan":true}, …]</c> plus optional record-level
    /// metadata entries such as <c>{"meta":{"q":"legacy","gaps":2}}</c>. Stored as <c>jsonb</c> so it is queryable.
    /// </summary>
    [Column(TypeName = "jsonb")]
    public string ChannelIndex { get; set; } = "[]";

    /// <summary>Brotli-compressed payload. Absent values are NaN.</summary>
    public byte[] Data { get; set; } = Array.Empty<byte>();

    public int UncompressedBytes { get; set; }

    public int ProcessorVersion { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
