using Domain.Telemetry;
using FluentAssertions;

namespace Tests.Domain;

public class LapPlausibilityTests
{
    [Theory]
    [InlineData(30, false)]
    [InlineData(19_999, false)]
    [InlineData(20_000, true)]
    [InlineData(125_610, true)]
    public void A_Lap_Under_Twenty_Seconds_Is_Not_Believable(int lapMs, bool expected) =>
        LapPlausibility.IsPlausible(lapMs).Should().Be(expected);

    [Fact]
    public void Missing_Or_Zero_Times_Are_Not_Believable()
    {
        LapPlausibility.IsPlausible(null).Should().BeFalse();
        LapPlausibility.IsPlausible(0).Should().BeFalse();
    }

    [Fact]
    public void A_Known_Track_Length_Raises_The_Floor_At_360_Kmh()
    {
        // Spa, 7004 m: at 100 m/s that is 70.04 s.
        LapPlausibility.MinLapMsFor(7004f).Should().Be(70_040);
        LapPlausibility.IsPlausible(65_000, 7004f).Should().BeFalse();
        LapPlausibility.IsPlausible(137_000, 7004f).Should().BeTrue();
        // A short track still keeps the 20 s floor.
        LapPlausibility.MinLapMsFor(1000f).Should().Be(LapPlausibility.MinLapMs);
    }

    [Theory]
    // current best, lap, valid, expected
    [InlineData(0, 125_610, true, 125_610)]
    [InlineData(127_390, 125_610, true, 125_610)]
    [InlineData(125_610, 127_390, true, 125_610)]
    [InlineData(125_610, 30, true, 125_610)]       // the BUG-019 lap
    [InlineData(125_610, 120_000, false, 125_610)] // invalid laps never count
    [InlineData(30, 127_390, true, 127_390)]       // a bad stored best is replaced
    [InlineData(30, 30, true, 30)]                 // nothing believable yet: leave it for the repair
    public void Next_Session_Best_Only_Takes_Valid_Believable_Faster_Laps(int current, int lap, bool valid, int expected) =>
        LapPlausibility.NextSessionBest(current, lap, valid).Should().Be(expected);
}
