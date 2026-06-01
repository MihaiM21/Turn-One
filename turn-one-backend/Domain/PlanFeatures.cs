using Domain.Enums;

namespace Domain;

public record SimRacingPlanFeatures(
    bool MultiChannelChart,
    bool Comparison,
    bool ReplayScrubber,
    bool CoachingTips,
    bool CoachingChat,
    bool OverlayTokens,
    bool SpectatePublic,
    int SessionLimit
);

public static class PlanFeatures
{
    public static SimRacingPlanFeatures SimRacing(PlanType plan) => plan switch
    {
        PlanType.BASIC => new(
            MultiChannelChart: false,
            Comparison: false,
            ReplayScrubber: false,
            CoachingTips: false,
            CoachingChat: false,
            OverlayTokens: false,
            SpectatePublic: false,
            SessionLimit: 1
        ),
        PlanType.PRO => new(
            MultiChannelChart: true,
            Comparison: true,
            ReplayScrubber: true,
            CoachingTips: true,
            CoachingChat: false,
            OverlayTokens: true,
            SpectatePublic: true,
            SessionLimit: 5
        ),
        PlanType.ELITE => new(
            MultiChannelChart: true,
            Comparison: true,
            ReplayScrubber: true,
            CoachingTips: true,
            CoachingChat: true,
            OverlayTokens: true,
            SpectatePublic: true,
            SessionLimit: 15
        ),
        _ => SimRacing(PlanType.BASIC)
    };
}
