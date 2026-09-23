using Domain;
using Domain.Enums;
using FluentAssertions;

namespace Tests.Domain;

public class PlanFeaturesTests
{
    [Fact]
    public void Basic_Plan_Has_No_Comparison_And_Single_Session()
    {
        var features = PlanFeatures.SimRacing(PlanType.BASIC);

        features.Comparison.Should().BeFalse();
        features.SessionLimit.Should().Be(1);
    }

    [Fact]
    public void Pro_Plan_Has_Comparison_And_Five_Sessions()
    {
        var features = PlanFeatures.SimRacing(PlanType.PRO);

        features.Comparison.Should().BeTrue();
        features.SessionLimit.Should().Be(5);
    }

    [Fact]
    public void Elite_Plan_Has_Coaching_Chat()
    {
        var features = PlanFeatures.SimRacing(PlanType.ELITE);

        features.CoachingChat.Should().BeTrue();
    }
}
