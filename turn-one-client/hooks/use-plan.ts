"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { planFeatures, type PlanType, type SimRacingPlanFeatures } from "@/lib/plan-features";

const PLAN_ORDER: PlanType[] = ["BASIC", "PRO", "ELITE"];

/**
 * Some endpoints serialise the plan as the enum's numeric value rather than its name,
 * so accept both shapes.
 */
export function normalizePlan(raw: unknown): PlanType {
    if (typeof raw === "number") return PLAN_ORDER[raw] ?? "BASIC";
    if (typeof raw === "string") {
        const upper = raw.toUpperCase();
        if ((PLAN_ORDER as string[]).includes(upper)) return upper as PlanType;
        const asNumber = Number(raw);
        if (Number.isInteger(asNumber)) return PLAN_ORDER[asNumber] ?? "BASIC";
    }
    return "BASIC";
}

export function planAtLeast(plan: PlanType, required: PlanType) {
    return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(required);
}

export interface UsePlanResult {
    plan: PlanType;
    features: SimRacingPlanFeatures;
    loading: boolean;
    isAuthenticated: boolean;
    atLeast: (required: PlanType) => boolean;
    /** PRO+ or the existing CONTENT_CREATOR role. Soft gate only — see share-controls.tsx for what's actually enforced server-side. */
    watermarkFree: boolean;
    /** True when Role === CONTENT_CREATOR (see Domain/Enums/Role.cs) — not a separate flag. */
    isCreator: boolean;
    /** Highest export preset key this user may pick from the creator export menu. */
    maxExportResolution: "social" | "yt_thumb" | "overlay_4k";
}

/**
 * Entitlement for the simracing section. Gates read from here rather than inferring
 * entitlement from a 403 response, so locked features render an upsell instead of a
 * blank panel.
 */
export function usePlan(): UsePlanResult {
    const { user, loading, isAuthenticated } = useAuth();

    return useMemo(() => {
        const plan = normalizePlan(user?.plan);
        const isCreator = user?.role === "CONTENT_CREATOR";
        const watermarkFree = isCreator || planAtLeast(plan, "PRO");
        return {
            plan,
            features: planFeatures(plan),
            loading,
            isAuthenticated,
            atLeast: (required: PlanType) => planAtLeast(plan, required),
            watermarkFree,
            isCreator,
            maxExportResolution: isCreator ? "overlay_4k" : watermarkFree ? "yt_thumb" : "social",
        };
    }, [user?.plan, user?.role, loading, isAuthenticated]);
}
