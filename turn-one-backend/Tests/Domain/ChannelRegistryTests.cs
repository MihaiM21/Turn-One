using Domain.Enums;
using Domain.Telemetry;
using FluentAssertions;

namespace Tests.Domain;

public class ChannelRegistryTests
{
    [Fact]
    public void Basic_Can_Read_Speed_And_Pedals_But_Not_GForces()
    {
        var allowed = ChannelRegistry.AllowedFor(PlanType.BASIC);

        allowed.Should().Contain(new[] { ChannelRegistry.Speed, ChannelRegistry.Throttle, ChannelRegistry.Brake, ChannelRegistry.V1SpeedKmh });
        allowed.Should().NotContain(new[] { ChannelRegistry.GLat, ChannelRegistry.Steer, ChannelRegistry.V1Gas });
    }

    [Fact]
    public void ResolveAllowed_Drops_Unknown_And_Gated_Channels()
    {
        var resolved = ChannelRegistry.ResolveAllowed(PlanType.PRO, new[] { ChannelRegistry.V1Gas, "nonexistent", ChannelRegistry.GLat });

        resolved.Select(d => d.Key).Should().BeEquivalentTo(new[] { ChannelRegistry.V1Gas, ChannelRegistry.GLat });

        ChannelRegistry.ResolveAllowed(PlanType.BASIC, new[] { ChannelRegistry.GLat }).Should().BeEmpty();
    }

    [Fact]
    public void Colliding_Keys_Resolve_To_V2_Definition()
    {
        // "gear" exists in both protocols; the v2 (tick) definition must win.
        ChannelRegistry.Find(ChannelRegistry.Gear)!.MsgType.Should().Be(ChannelRegistry.Tick);
        ChannelRegistry.Find(ChannelRegistry.V1SpeedKmh)!.MsgType.Should().Be(ChannelRegistry.Physics);
    }

    [Fact]
    public void Aggregation_Follows_Kind()
    {
        ChannelRegistry.Find(ChannelRegistry.Speed)!.Agg.Should().Be(ChannelAggregation.Mean);
        ChannelRegistry.Find(ChannelRegistry.Gear)!.Agg.Should().Be(ChannelAggregation.Last);
        ChannelRegistry.Find(ChannelRegistry.Heading)!.Agg.Should().Be(ChannelAggregation.Last, "angles wrap and must not be averaged");
        ChannelRegistry.Find(ChannelRegistry.Valid)!.Agg.Should().Be(ChannelAggregation.Last);
    }

    [Theory]
    [InlineData("speedKmh", "speed")]
    [InlineData("gas", "throttle")]
    [InlineData("accG_x", "gLat")]
    [InlineData("tyreCoreTemperature_fl", "tyreTemp_fl")]
    [InlineData("wheelsPressure_rr", "tyrePress_rr")]
    [InlineData("gear", "gear")]
    [InlineData("brakeTemp_fr", "brakeTemp_fr")]
    public void Canonical_Maps_V1_Keys_To_V2(string v1, string expected)
    {
        ChannelRegistry.Canonical(v1).Should().Be(expected);
    }

    [Fact]
    public void Every_V2_Alias_Target_Is_A_Registered_V2_Channel()
    {
        foreach (var (_, target) in ChannelRegistry.V1ToV2)
        {
            var def = ChannelRegistry.Find(target) ?? ChannelRegistry.Find(target + "_fl");
            def.Should().NotBeNull($"alias target {target} must exist");
            def!.IsV2.Should().BeTrue();
        }
    }

    [Fact]
    public void Corner_Array_Fields_Cover_Both_Protocols()
    {
        ChannelRegistry.CornerArrayFields.Should().Contain(new[] { "tyreCoreTemperature", ChannelRegistry.TyreTemp, ChannelRegistry.Slip });
    }

    [Fact]
    public void Bounded_Lap_Queries_Get_A_Fine_Window()
    {
        var from = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        ChannelRegistry.SampleWindowMs(PlanType.PRO, from, from.AddSeconds(95)).Should().Be(100);
        ChannelRegistry.SampleWindowMs(PlanType.BASIC, from, from.AddSeconds(95)).Should().Be(250);
        ChannelRegistry.SampleWindowMs(PlanType.PRO, null, null).Should().Be(1000);
    }
}
