using Application.Telemetry;
using Domain.Enums;
using Domain.Telemetry;
using FluentAssertions;
using Tests.Fixtures;

namespace Tests.Application;

public class LapPipelineTests
{
    [Fact]
    public void Normalizer_Uses_LapDist_And_Classifies_Flying()
    {
        var lap = new SyntheticLap().Normalized();

        lap.Kind.Should().Be(LapKind.Flying);
        lap.DistanceSource.Should().Be(DistanceSource.LapDistance);
        lap.Coverage.Should().BeApproximately(1f, 0.01f);
        lap.DistanceM.Should().BeInAscendingOrder();
    }

    [Fact]
    public void Normalizer_Integrates_Speed_When_LapDist_Missing_And_Rescales()
    {
        var lap = new SyntheticLap { IncludeLapDist = false }.Normalized();

        lap.DistanceSource.Should().Be(DistanceSource.SpeedIntegrated);
        // Speed integration of a 20 Hz trace is within a percent or two; rescaling snaps it to the track length.
        lap.LengthM.Should().BeApproximately(4000f, 1f);
        lap.Kind.Should().Be(LapKind.Flying);
    }

    [Fact]
    public void Normalizer_Aborts_On_Flashback()
    {
        var ticks = new SyntheticLap().Generate();
        // Jump back 300 m two-thirds through the lap.
        var idx = ticks.FindIndex(t => t.LapDistM > 2600f);
        for (var i = idx; i < ticks.Count; i++) ticks[i].V[TickLayout.LapDistM] -= 300f;

        var lap = LapDistanceNormalizer.Normalize(ticks, 4000f);

        lap.Kind.Should().Be(LapKind.Aborted);
        lap.Reason.Should().Contain("backwards");
        lap.Ticks.Count.Should().Be(idx);
    }

    [Fact]
    public void Normalizer_Treats_Constant_Zero_LapDist_As_Absent_And_Integrates_Speed()
    {
        // A Link that doesn't know the track length sends normalizedPosition x 0 on every tick.
        var ticks = new SyntheticLap().Generate();
        foreach (var t in ticks) t.V[TickLayout.LapDistM] = 0f;

        var lap = LapDistanceNormalizer.Normalize(ticks, 4000f);

        lap.DistanceSource.Should().Be(DistanceSource.SpeedIntegrated);
        lap.Kind.Should().Be(LapKind.Flying);
        lap.LengthM.Should().BeApproximately(4000f, 40f);
    }

    [Fact]
    public void Normalizer_Flags_Pit_Laps()
    {
        var ticks = new SyntheticLap().Generate();
        foreach (var t in ticks.Take(40)) t.V[TickLayout.Pit] = 1f;

        LapDistanceNormalizer.Normalize(ticks, 4000f).Kind.Should().Be(LapKind.OutLap);
    }

    [Fact]
    public void Resampler_Produces_2m_Grid_With_Monotonic_Time()
    {
        var s = new SyntheticLap().Samples();

        s.StepM.Should().Be(2f);
        s.Count.Should().Be(2001); // 0..4000 inclusive
        var time = s.Get(ChannelRegistry.TimeMs)!;
        time.Should().BeInAscendingOrder();
        time[0].Should().BeApproximately(0f, 60f);
        s.Get(ChannelRegistry.Gear)!.Should().OnlyContain(g => g == MathF.Round(g), "gear is held, never interpolated");
        s.Has(ChannelRegistry.LapDistM).Should().BeFalse("distance is implied by the grid");
        s.Has(ChannelRegistry.Drs).Should().BeFalse("channels the sim never sent are dropped");
    }

    [Fact]
    public void Codec_Round_Trips_Including_NaN()
    {
        var s = new SyntheticLap().Samples();
        // Poke a hole to exercise NaN preservation.
        s.Get(ChannelRegistry.Fuel)![10] = float.NaN;

        var (data, index, raw) = LapChannelCodec.Encode(s, new LapContainerMeta { Gaps = 1, Coverage = 0.99f });
        var back = LapChannelCodec.Decode(data, index, s.StepM, s.Count);

        raw.Should().Be(s.Channels.Count * s.Count * 4);
        data.Length.Should().BeLessThan(raw, "brotli must compress smooth float data");
        back.Count.Should().Be(s.Count);
        back.Channels.Keys.Should().BeEquivalentTo(s.Channels.Keys);
        back.Get(ChannelRegistry.Speed)!.Should().Equal(s.Get(ChannelRegistry.Speed)!);
        float.IsNaN(back.Get(ChannelRegistry.Fuel)![10]).Should().BeTrue();
        LapChannelCodec.ParseIndex(index).Meta.Gaps.Should().Be(1);

        var subset = LapChannelCodec.Decode(data, index, s.StepM, s.Count, new[] { ChannelRegistry.Speed }, decimate: 4);
        subset.Channels.Keys.Should().BeEquivalentTo(new[] { ChannelRegistry.Speed });
        subset.StepM.Should().Be(8f);
        subset.Count.Should().Be((s.Count + 3) / 4);
        subset.Get(ChannelRegistry.Speed)![1].Should().Be(s.Get(ChannelRegistry.Speed)![4]);
    }

    [Fact]
    public void Detector_Finds_All_Eight_Corners_With_Apex_And_Braking_Point()
    {
        var synth = new SyntheticLap();
        var s = synth.Samples();

        var corners = CornerDetector.Detect(s);

        corners.Should().HaveCount(8);
        for (var i = 0; i < 8; i++)
        {
            var expected = synth.Corners[i];
            var c = corners[i];
            c.Index.Should().Be(i);
            c.Direction.Should().Be(expected.Direction);
            // Speed keeps dropping to ~the apex; allow the decel-rate limiter to shift it a little.
            c.ApexM.Should().BeApproximately(expected.ApexM, 12f, $"apex of corner {i}");
            c.BrakingPointM.Should().NotBeNull($"corner {i} has a braking zone");
            c.BrakingPointM!.Value.Should().BeApproximately(expected.ApexM - expected.BrakeZoneM, 8f, $"braking point of corner {i}");
            c.MinSpeedKmh.Should().BeApproximately(expected.MinSpeedKmh, 6f);
            c.ThrottleOnM.Should().NotBeNull();
            c.ThrottleOnM!.Value.Should().BeGreaterThan(c.BrakingPointM.Value);
            c.IsKink.Should().BeFalse();
            c.TimeInCornerMs.Should().BePositive();
            c.Source.Should().Be(CornerSignalSource.LateralG);
        }
    }

    [Fact]
    public void Detector_Falls_Back_To_Steering_Without_GLat()
    {
        var s = new SyntheticLap { IncludeGLat = false }.Samples();

        var corners = CornerDetector.Detect(s);

        corners.Should().HaveCount(8);
        corners.Should().OnlyContain(c => c.Source == CornerSignalSource.Steer);
    }

    [Fact]
    public void Summary_Derives_Sectors_And_Validity()
    {
        var synth = new SyntheticLap();
        var lap = synth.Normalized();
        var s = LapResampler.Resample(lap);

        var summary = LapSummaryCalculator.Compute(s, lap, complete: null, SimSource.Acc);

        summary.IsValid.Should().BeTrue();
        summary.Kind.Should().Be(LapKind.Flying);
        summary.LapTimeMs.Should().BeGreaterThan(60_000).And.BeLessThan(120_000);
        summary.SectorsMs.Should().HaveCount(3).And.OnlyContain(v => v.HasValue && v > 0);
        summary.SectorsMs.Sum(v => v!.Value).Should().BeCloseTo(summary.LapTimeMs!.Value, 5);
        summary.SectorBoundariesM.Should().HaveCount(2);
        summary.SectorBoundariesM[0].Should().BeApproximately(4000f / 3, 4f);
        summary.MaxSpeedKmh.Should().BeApproximately(230f, 1f);
        summary.FullThrottlePct.Should().BeInRange(30f, 80f);
        summary.BrakingPct.Should().BeInRange(10f, 40f);
        summary.FuelUsedL.Should().BeGreaterThan(0);
        summary.GearShifts.Should().BeGreaterThan(8);
    }

    [Fact]
    public void Summary_Prefers_LapComplete_Timing()
    {
        var synth = new SyntheticLap();
        var lap = synth.Normalized();
        var s = LapResampler.Resample(lap);
        var complete = new LapCompleteInfo { Lap = 3, LapTimeMs = 91_234, SectorsMs = new[] { 30_000, 31_000, 30_234 }, Valid = false };

        var summary = LapSummaryCalculator.Compute(s, lap, complete, SimSource.Acc);

        summary.LapTimeMs.Should().Be(91_234);
        summary.SectorsMs.Should().Equal(new int?[] { 30_000, 31_000, 30_234 });
        summary.IsValid.Should().BeFalse("the sim said the lap was invalid");
    }

    [Fact]
    public void IRacing_Without_Valid_Flag_Trusts_A_Flying_Lap()
    {
        var ticks = new SyntheticLap().Generate();
        foreach (var t in ticks) t.V[TickLayout.Valid] = float.NaN;
        var lap = LapDistanceNormalizer.Normalize(ticks, 4000f);
        var s = LapResampler.Resample(lap);

        LapSummaryCalculator.Compute(s, lap, null, SimSource.IRacing).IsValid.Should().BeTrue();
        LapSummaryCalculator.Compute(s, lap, null, SimSource.Acc).IsValid.Should().BeFalse("ACC always reports validity; silence means unknown");
    }

    [Fact]
    public void Delta_End_Point_Equals_Lap_Time_Difference()
    {
        var fast = new SyntheticLap().Samples();
        var slow = new SyntheticLap { SpeedScale = 0.96f }.Samples();

        var delta = LapMath.DeltaMs(slow, fast);

        delta.Should().HaveCount(Math.Min(fast.Count, slow.Count));
        delta[0].Should().BeApproximately(0f, 60f);
        var expected = slow.Get(ChannelRegistry.TimeMs)![^1] - fast.Get(ChannelRegistry.TimeMs)![^1];
        delta[^1].Should().BeApproximately(expected, 0.01f);
        delta[^1].Should().BePositive("slower corners lose time");
        // The slower lap never gains time back on this layout: allow sub-frame interpolation jitter only.
        for (var i = 1; i < delta.Length; i++)
            (delta[i] - delta[i - 1]).Should().BeGreaterThanOrEqualTo(-5f, $"at sample {i}");
    }

    [Fact]
    public void Profile_Matches_Corners_Across_Laps_And_Rebuilds_From_Samples()
    {
        var reference = new SyntheticLap().Samples();
        var refCorners = CornerDetector.Detect(reference);
        var profile = TrackProfileBuilder.FromSingleLap(refCorners);

        var other = new SyntheticLap { SpeedScale = 0.95f }.Samples();
        var otherCorners = CornerDetector.Detect(other);
        TrackProfileBuilder.Match(otherCorners, profile);

        otherCorners.Should().OnlyContain(c => c.RefIndex != null);
        otherCorners.Select(c => c.RefIndex!.Value).Should().BeEquivalentTo(Enumerable.Range(0, 8));

        var set = new CornerSampleSet();
        for (var i = 0; i < 12; i++)
            TrackProfileBuilder.AddSample(set, CornerDetector.Detect(new SyntheticLap { SpeedScale = 0.93f + 0.01f * (i % 6) }.Samples()));
        var rebuilt = TrackProfileBuilder.Rebuild(set, 4000f);

        rebuilt.Should().HaveCount(8);
        rebuilt.Select(r => r.Index).Should().Equal(Enumerable.Range(0, 8));
        rebuilt[2].ApexM.Should().BeApproximately(1300f, 12f);
        rebuilt[2].Direction.Should().Be(+1);
    }
}
