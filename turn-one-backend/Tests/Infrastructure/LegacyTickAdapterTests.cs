using Application.Interfaces;
using Application.Telemetry;
using Domain.Telemetry;
using FluentAssertions;
using Infrastructure.Services;

namespace Tests.Infrastructure;

public class LegacyTickAdapterTests
{
    private static readonly DateTime T0 = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private static RawTick Physics(double t, Dictionary<string, double> fields) =>
        new() { Time = T0.AddSeconds(t), MsgType = ChannelRegistry.Physics, Fields = fields };

    private static RawTick Graphics(double t, Dictionary<string, double> fields) =>
        new() { Time = T0.AddSeconds(t), MsgType = ChannelRegistry.Graphics, Fields = fields };

    [Fact]
    public void Merges_Interleaved_Physics_And_Graphics_By_Sample_And_Hold()
    {
        var raw = new List<RawTick>
        {
            Graphics(0.0, new() { [ChannelRegistry.V1CurrentSectorIndex] = 0, [ChannelRegistry.V1IsValidLap] = 1 }),
            Physics(0.05, new() { [ChannelRegistry.V1SpeedKmh] = 100 }),
            Physics(0.10, new() { [ChannelRegistry.V1SpeedKmh] = 110 }),
            Graphics(0.12, new() { [ChannelRegistry.V1CurrentSectorIndex] = 1 }),
            Physics(0.15, new() { [ChannelRegistry.V1SpeedKmh] = 120 }),
        };

        var ticks = LegacyTickAdapter.Convert(raw, trackLengthM: 4000f);

        ticks.Should().HaveCount(3);
        ticks[0].Get(ChannelRegistry.Speed).Should().Be(100f);
        // Before the sector-1 graphics row arrives, ticks hold the last known graphics value (sector 0).
        ticks[0].Get(ChannelRegistry.Sector).Should().Be(0f);
        ticks[0].Get(ChannelRegistry.Valid).Should().Be(1f);
        ticks[1].Get(ChannelRegistry.Speed).Should().Be(110f);
        ticks[1].Get(ChannelRegistry.Sector).Should().Be(0f);
        // The third physics tick arrives after the sector-1 graphics row: sample-and-hold picks it up.
        ticks[2].Get(ChannelRegistry.Speed).Should().Be(120f);
        ticks[2].Get(ChannelRegistry.Sector).Should().Be(1f);
    }

    [Fact]
    public void Maps_Legacy_Field_Names_Onto_V2_Keys()
    {
        var raw = new List<RawTick>
        {
            Physics(0, new()
            {
                [ChannelRegistry.V1SpeedKmh] = 180,
                [ChannelRegistry.V1Rpms] = 6500,
                [ChannelRegistry.V1Gas] = 0.8,
                ["tyreCoreTemperature_fl"] = 82.5,
            }),
        };

        var ticks = LegacyTickAdapter.Convert(raw, trackLengthM: 4000f);

        ticks.Should().HaveCount(1);
        ticks[0].Get(ChannelRegistry.Speed).Should().Be(180f, "speedKmh -> speed");
        ticks[0].Get(ChannelRegistry.Rpm).Should().Be(6500f, "rpms -> rpm");
        ticks[0].Get(ChannelRegistry.Throttle).Should().Be(0.8f, "gas -> throttle");
        ticks[0].Get(ChannelRegistry.TyreTemp + "_fl").Should().Be(82.5f, "tyreCoreTemperature_fl -> tyreTemp_fl");
    }

    [Theory]
    [InlineData(0, -1)] // R
    [InlineData(1, 0)]  // N
    [InlineData(2, 1)]  // 1st
    [InlineData(6, 5)]  // 5th
    public void Offsets_Gear_From_Acc_Raw_To_V2(double rawGear, float expected)
    {
        var raw = new List<RawTick> { Physics(0, new() { [ChannelRegistry.V1Gear] = rawGear }) };
        var ticks = LegacyTickAdapter.Convert(raw, trackLengthM: 4000f);
        ticks[0].Get(ChannelRegistry.Gear).Should().Be(expected);
    }

    [Fact]
    public void Computes_LapDistM_From_Spline_Position_Times_Track_Length()
    {
        var raw = new List<RawTick>
        {
            Physics(0, new()),
            Graphics(0, new() { [ChannelRegistry.V1NormalizedCarPosition] = 0.25 }),
        };

        var ticks = LegacyTickAdapter.Convert(raw, trackLengthM: 4000f);

        ticks[0].Get(ChannelRegistry.LapDistM).Should().Be(1000f);
    }

    [Fact]
    public void LapDistM_Is_NaN_When_Track_Length_Is_Unknown()
    {
        var raw = new List<RawTick>
        {
            Physics(0, new()),
            Graphics(0, new() { [ChannelRegistry.V1NormalizedCarPosition] = 0.25 }),
        };

        var ticks = LegacyTickAdapter.Convert(raw, trackLengthM: null);

        float.IsNaN(ticks[0].Get(ChannelRegistry.LapDistM)).Should().BeTrue();
    }

    [Fact]
    public void Derives_Lap_Number_From_CompletedLaps_Plus_One()
    {
        var raw = new List<RawTick>
        {
            Physics(0, new()),
            Graphics(0, new() { [ChannelRegistry.V1CompletedLaps] = 3 }),
        };

        var ticks = LegacyTickAdapter.Convert(raw, trackLengthM: 4000f);

        ticks[0].Lap.Should().Be(4);
    }
}
