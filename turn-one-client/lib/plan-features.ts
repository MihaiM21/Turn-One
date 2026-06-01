export type PlanType = "BASIC" | "PRO" | "ELITE";

export interface SimRacingPlanFeatures {
    multiChannelChart: boolean;
    comparison: boolean;
    replayScrubber: boolean;
    coachingTips: boolean;
    coachingChat: boolean;
    overlayTokens: boolean;
    spectatePublic: boolean;
    sessionLimit: number;
}

export const PLAN_FEATURES: Record<PlanType, SimRacingPlanFeatures> = {
    BASIC: {
        multiChannelChart: false,
        comparison: false,
        replayScrubber: false,
        coachingTips: false,
        coachingChat: false,
        overlayTokens: false,
        spectatePublic: false,
        sessionLimit: 1,
    },
    PRO: {
        multiChannelChart: true,
        comparison: true,
        replayScrubber: true,
        coachingTips: true,
        coachingChat: false,
        overlayTokens: true,
        spectatePublic: true,
        sessionLimit: 5,
    },
    ELITE: {
        multiChannelChart: true,
        comparison: true,
        replayScrubber: true,
        coachingTips: true,
        coachingChat: true,
        overlayTokens: true,
        spectatePublic: true,
        sessionLimit: 15,
    },
};

export function planFeatures(plan: PlanType | string | null | undefined): SimRacingPlanFeatures {
    if (plan && plan in PLAN_FEATURES) return PLAN_FEATURES[plan as PlanType];
    return PLAN_FEATURES.BASIC;
}
