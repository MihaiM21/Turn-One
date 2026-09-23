using Application.Telemetry;
using Domain.Telemetry;

namespace Tests.Fixtures;

/// <summary>A corner on the synthetic track: where the apex is, how slow the car gets, and which way it turns.</summary>
public sealed record SyntheticCorner(float ApexM, float MinSpeedKmh, int Direction, float BrakeZoneM = 120f);

/// <summary>
/// Generates protocol-v2 ticks for a fake lap with a known corner layout, so detector / resampler /
/// codec tests have ground truth. Straights at <see cref="StraightSpeedKmh"/>, each corner has a
/// braking zone ending 15 m before the apex, a bell-shaped lateral-g peak and a throttle ramp on exit.
/// </summary>
public sealed class SyntheticLap
{
    public float TrackLengthM { get; init; } = 4000f;
    public float StraightSpeedKmh { get; init; } = 230f;
    public float TickHz { get; init; } = 20f;
    public float PeakG { get; init; } = 1.6f;
    /// <summary>Per-lap multiplier on corner min speeds (1.0 = reference lap; 0.97 = slower).</summary>
    public float SpeedScale { get; init; } = 1f;
    public int LapNumber { get; init; } = 3;
    public long StartT { get; init; } = 1_758_100_000_000L;
    public bool IncludeLapDist { get; init; } = true;
    public bool IncludeGLat { get; init; } = true;
    public int SectorCount { get; init; } = 3;

    public static readonly SyntheticCorner[] EightCorners =
    {
        new(420f, 95f, +1), new(880f, 140f, -1), new(1300f, 70f, +1), new(1750f, 160f, -1),
        new(2250f, 110f, +1), new(2700f, 85f, -1), new(3150f, 175f, +1), new(3600f, 100f, -1)
    };

    public IReadOnlyList<SyntheticCorner> Corners { get; init; } = EightCorners;

    public float TargetSpeedAt(float d)
    {
        var v = StraightSpeedKmh;
        foreach (var c in Corners)
        {
            var minV = c.MinSpeedKmh * SpeedScale;
            var brakeStart = c.ApexM - c.BrakeZoneM;
            if (d >= brakeStart && d <= c.ApexM)
            {
                // Linear decel from straight speed to min speed across the brake zone.
                var w = (d - brakeStart) / c.BrakeZoneM;
                v = MathF.Min(v, StraightSpeedKmh + (minV - StraightSpeedKmh) * w);
            }
            else if (d > c.ApexM && d <= c.ApexM + 220f)
            {
                var w = (d - c.ApexM) / 220f;
                v = MathF.Min(v, minV + (StraightSpeedKmh - minV) * MathF.Sqrt(w));
            }
        }
        return v;
    }

    public float GLatAt(float d)
    {
        var g = 0f;
        foreach (var c in Corners)
        {
            var half = 45f;
            var x = (d - c.ApexM) / half;
            if (MathF.Abs(x) < 1.6f) g += c.Direction * PeakG * MathF.Exp(-x * x * 2f);
        }
        return g;
    }

    public float BrakeAt(float d)
    {
        foreach (var c in Corners)
        {
            var brakeStart = c.ApexM - c.BrakeZoneM;
            var brakeEnd = c.ApexM - 15f;
            if (d >= brakeStart && d <= brakeEnd)
            {
                var w = (d - brakeStart) / (brakeEnd - brakeStart);
                return w < 0.15f ? w / 0.15f : 1f - 0.5f * w; // quick ramp up, trail off
            }
        }
        return 0f;
    }

    public float ThrottleAt(float d)
    {
        foreach (var c in Corners)
        {
            if (d >= c.ApexM - c.BrakeZoneM && d < c.ApexM - 5f) return 0f;
            if (d >= c.ApexM - 5f && d <= c.ApexM + 60f) return MathF.Min(1f, (d - (c.ApexM - 5f)) / 65f);
        }
        return 1f;
    }

    public static int GearFor(float speedKmh) => Math.Clamp((int)MathF.Ceiling(speedKmh / 40f), 1, 6);

    public int SectorAt(float d) => Math.Min(SectorCount - 1, (int)(d / TrackLengthM * SectorCount));

    public List<TickV2> Generate()
    {
        var ticks = new List<TickV2>();
        var dt = 1f / TickHz;
        var d = 0f;
        var tMs = 0f;
        var speed = TargetSpeedAt(0);
        var fuel = 60f;
        long frame = 1000;
        while (d < TrackLengthM)
        {
            var tick = TickV2.Empty(StartT + (long)tMs);
            var v = tick.V;
            v[TickLayout.Lap] = LapNumber;
            v[TickLayout.LapTimeMs] = tMs;
            if (IncludeLapDist) v[TickLayout.LapDistM] = d;
            v[TickLayout.Sector] = SectorAt(d);
            v[TickLayout.Speed] = speed;
            v[TickLayout.Rpm] = 4000 + speed * 20;
            v[TickLayout.Gear] = GearFor(speed);
            v[TickLayout.Throttle] = ThrottleAt(d);
            v[TickLayout.Brake] = BrakeAt(d);
            v[TickLayout.Steer] = GLatAt(d) / 2.2f;
            if (IncludeGLat) v[TickLayout.GLat] = GLatAt(d);
            v[TickLayout.GLong] = 0f;
            v[TickLayout.Valid] = 1f;
            v[TickLayout.Pit] = 0f;
            v[TickLayout.Fuel] = fuel;
            v[TickLayout.Frame] = frame++;
            var angle = d / TrackLengthM * 2 * MathF.PI;
            v[TickLayout.PosX] = MathF.Cos(angle) * 600f;
            v[TickLayout.PosY] = MathF.Sin(angle) * 600f;
            v[TickLayout.Heading] = angle + MathF.PI / 2;
            ticks.Add(tick);

            // Advance: constant speed within the tick, then move toward the target for the next one.
            d += speed / 3.6f * dt;
            tMs += dt * 1000f;
            fuel -= 0.0009f;
            var target = TargetSpeedAt(d);
            // Limit accel/decel rates so the trace is physically plausible.
            var maxStep = target < speed ? 55f * dt : 30f * dt; // km/h per second
            speed = MathF.Abs(target - speed) <= maxStep ? target : speed + MathF.Sign(target - speed) * maxStep;
        }
        // One tick exactly at the line to close the lap, with the time interpolated to the line.
        var prev = ticks[^1];
        var prevD = IncludeLapDist ? prev.LapDistM : d - prev.Speed / 3.6f * dt;
        var remainingM = TrackLengthM - prevD;
        var tLineMs = prev.LapTimeMs + remainingM / (prev.Speed / 3.6f) * 1000f;
        var last = TickV2.Empty(StartT + (long)tLineMs);
        Array.Copy(prev.V, last.V, last.V.Length);
        last.V[TickLayout.LapDistM] = IncludeLapDist ? TrackLengthM : float.NaN;
        last.V[TickLayout.LapTimeMs] = tLineMs;
        ticks.Add(last);
        return ticks;
    }

    public NormalizedLap Normalized() => LapDistanceNormalizer.Normalize(Generate(), TrackLengthM);

    public LapSamples Samples() => LapResampler.Resample(Normalized());
}
