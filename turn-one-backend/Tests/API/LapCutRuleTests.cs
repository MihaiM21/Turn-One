using Application.Telemetry;
using FluentAssertions;

namespace Tests.API;

public class LapCutRuleTests
{
    [Fact]
    public void Same_Lap_Continues()
    {
        LapCutRule.Decide(currentLap: 3, tickLap: 3, tickLapDistM: 1500f, trackLengthM: 5000f)
            .Should().Be(LapCutDecision.Continue);
    }

    [Fact]
    public void First_Tick_Ever_Cuts_And_Starts_Even_At_Zero_Distance()
    {
        // currentLap == 0 means no lap has started yet — always trust the first crossing.
        LapCutRule.Decide(currentLap: 0, tickLap: 1, tickLapDistM: 4999f, trackLengthM: 5000f)
            .Should().Be(LapCutDecision.CutAndStart);
    }

    [Fact]
    public void Lap_Increment_Near_Start_Of_Lap_Cuts_And_Starts()
    {
        // 1500 / 5000 = 0.30... wait, need < 0.15 * L = 750m to count as "near start".
        LapCutRule.Decide(currentLap: 3, tickLap: 4, tickLapDistM: 100f, trackLengthM: 5000f)
            .Should().Be(LapCutDecision.CutAndStart);
    }

    [Fact]
    public void Lap_Increment_Far_From_Start_Continues_Instead_Of_Cutting()
    {
        // Lap counter bumped but we're deep into the track — treat as noise, keep buffering the same lap.
        LapCutRule.Decide(currentLap: 3, tickLap: 4, tickLapDistM: 2500f, trackLengthM: 5000f)
            .Should().Be(LapCutDecision.Continue);
    }

    [Fact]
    public void Lap_Increment_With_Unknown_Track_Length_Always_Cuts()
    {
        LapCutRule.Decide(currentLap: 2, tickLap: 3, tickLapDistM: 3000f, trackLengthM: 0f)
            .Should().Be(LapCutDecision.CutAndStart);

        LapCutRule.Decide(currentLap: 2, tickLap: 3, tickLapDistM: 3000f, trackLengthM: null)
            .Should().Be(LapCutDecision.CutAndStart);
    }

    [Fact]
    public void Lap_Increment_With_Nan_Distance_Always_Cuts()
    {
        LapCutRule.Decide(currentLap: 2, tickLap: 3, tickLapDistM: float.NaN, trackLengthM: 5000f)
            .Should().Be(LapCutDecision.CutAndStart);
    }

    [Fact]
    public void Lap_Counter_Going_Backwards_Discards()
    {
        LapCutRule.Decide(currentLap: 5, tickLap: 4, tickLapDistM: 1200f, trackLengthM: 5000f)
            .Should().Be(LapCutDecision.Discard);
    }

    [Fact]
    public void Boundary_At_Exactly_15_Percent_Cuts()
    {
        // 0.15 * 5000 = 750; a distance strictly less than that counts as near-start.
        LapCutRule.Decide(currentLap: 1, tickLap: 2, tickLapDistM: 749f, trackLengthM: 5000f)
            .Should().Be(LapCutDecision.CutAndStart);

        LapCutRule.Decide(currentLap: 1, tickLap: 2, tickLapDistM: 750f, trackLengthM: 5000f)
            .Should().Be(LapCutDecision.Continue);
    }

    [Fact]
    public void Lap_Clock_Reset_Within_Same_Lap_Restarts_The_Buffer()
    {
        // ACC pit-exit: iCurrentTime jumps from 133 s back to 8 s while completedLaps stays put.
        LapCutRule.Decide(currentLap: 1, tickLap: 1, tickLapDistM: float.NaN, trackLengthM: 5842f, lastLapTimeMs: 133_621f, tickLapTimeMs: 8_282f)
            .Should().Be(LapCutDecision.Restart);
    }

    [Fact]
    public void Small_Lap_Clock_Jitter_Does_Not_Restart()
    {
        LapCutRule.Decide(currentLap: 1, tickLap: 1, tickLapDistM: 100f, trackLengthM: 5842f, lastLapTimeMs: 10_050f, tickLapTimeMs: 10_000f)
            .Should().Be(LapCutDecision.Continue);
    }

    [Fact]
    public void Lap_Increment_Wins_Over_Clock_Reset()
    {
        // A genuine S/F crossing also resets the clock — that is a cut, not a restart.
        LapCutRule.Decide(currentLap: 1, tickLap: 2, tickLapDistM: 12f, trackLengthM: 5842f, lastLapTimeMs: 126_000f, tickLapTimeMs: 55f)
            .Should().Be(LapCutDecision.CutAndStart);
    }
}
