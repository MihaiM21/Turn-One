/**
 * The analysis page's "more plots" catalog: a declarative list of the extra overlay
 * visualizations, each keyed so the page can group them into category tabs and gate the PRO ones
 * behind `PlanGate` without every plot component knowing about plans or layout.
 *
 * Each entry's `render` returns the plot's JSX by delegating to a component under
 * `components/dashboard/simracing/plots/`; this file stays `.ts` (no JSX) so the catalog itself can
 * be imported from anywhere — including the plain analysis primitives — without pulling in a
 * client bundle boundary.
 */

import { createElement, type ReactNode } from "react";
import type { CornerCompareDto, LapOverlayDto } from "@/lib/simracing/protocol";

import { CornerDuelPlot } from "@/components/dashboard/simracing/plots/corner-duel";
import { BrakingPointsPlot } from "@/components/dashboard/simracing/plots/braking-points";
import { SectorHeatmapPlot } from "@/components/dashboard/simracing/plots/sector-heatmap";
import { SpeedGearPlot } from "@/components/dashboard/simracing/plots/speed-gear";
import { FrictionOverlayPlot } from "@/components/dashboard/simracing/plots/friction-overlay";
import { TyrePerLapPlot } from "@/components/dashboard/simracing/plots/tyre-per-lap";
import { FuelPerLapPlot } from "@/components/dashboard/simracing/plots/fuel-per-lap";
import { LapConsistencyPlot } from "@/components/dashboard/simracing/plots/lap-consistency";

export type SimPlotCategory = "corners" | "pace" | "inputs" | "car";

export const SIM_PLOT_CATEGORIES: { key: SimPlotCategory; label: string }[] = [
    { key: "corners", label: "Corners" },
    { key: "pace", label: "Pace" },
    { key: "inputs", label: "Inputs" },
    { key: "car", label: "Car" },
];

export interface SimPlotExplainer {
    /** One or two sentences, jargon-free: what is actually plotted. */
    what: string;
    /** A concrete reading instruction ("taller bar = faster"). */
    howToRead: string;
    /** What an interesting or notable result looks like. */
    lookFor: string[];
}

export interface SimPlotContext {
    overlay: LapOverlayDto;
    corners: CornerCompareDto | null;
    refLapId: string;
    /** Lap id -> display color. */
    colors: Record<string, string>;
    /** Lap id -> display label ("Lap 12"). */
    labels: Record<string, string>;
}

export interface SimPlotDefinition {
    key: string;
    title: string;
    shortTitle: string;
    description: string;
    category: SimPlotCategory;
    /** Minimum laps in the overlay for this plot to be meaningful. */
    minLaps: number;
    /** Channel keys (from `LapOverlayDto.channels`) every one of which must be present. */
    requiresChannels?: string[];
    /** Wrapped in `PlanGate required="PRO"` when mounted. */
    isPro?: boolean;
    explainer: SimPlotExplainer;
    isEmpty?: (ctx: SimPlotContext) => boolean;
    render: (ctx: SimPlotContext) => ReactNode;
}

// ---------------------------------------------------------------------------
// Shared empty-state helpers
// ---------------------------------------------------------------------------

function hasChannels(overlay: LapOverlayDto, channels: string[]): boolean {
    return channels.every(c => overlay.channels.includes(c));
}

/** `isEmpty` for plots that only need the overlay's laps + channels (no corner data). */
function emptyWhenMissing(minLaps: number, requiresChannels?: string[]) {
    return (ctx: SimPlotContext) =>
        ctx.overlay.laps.length < minLaps || (!!requiresChannels?.length && !hasChannels(ctx.overlay, requiresChannels));
}

/** `isEmpty` for plots built from `CornerCompareDto` (corner-by-corner comparisons). */
function emptyWhenNoCorners(minLaps: number) {
    return (ctx: SimPlotContext) =>
        ctx.overlay.laps.length < minLaps || !ctx.corners || ctx.corners.rows.length === 0;
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export const SIM_PLOTS: SimPlotDefinition[] = [
    {
        key: "corner-duel",
        title: "Corner duel",
        shortTitle: "Corner duel",
        description: "Apex speed and time gained or lost, corner by corner, against the reference lap.",
        category: "corners",
        minLaps: 2,
        isPro: true,
        explainer: {
            what:
                "For each corner, a pair of bars per lap: how much faster or slower its apex speed was than the reference lap, and how much time it gained or lost through the corner.",
            howToRead: "Bars above zero beat the reference; bars below it lost time or speed there.",
            lookFor: [
                "A corner where every lap loses time — likely a track feature, not a driving mistake",
                "Big time loss with only a small apex-speed loss — often a late or early braking point rather than a slow apex",
                "Click a bar to zoom every synced chart into that corner",
            ],
        },
        isEmpty: emptyWhenNoCorners(2),
        render: ctx => createElement(CornerDuelPlot, { ctx }),
    },
    {
        key: "braking-points",
        title: "Braking points",
        shortTitle: "Braking",
        description: "Braking distance before the apex and throttle-on distance after it, per corner and lap.",
        category: "corners",
        minLaps: 2,
        isPro: true,
        explainer: {
            what:
                "For every corner, a row of dots marking how far before the apex each lap started braking, and a second row marking how far after the apex each lap got back to throttle.",
            howToRead:
                "A dot further left in the braking row means braking started earlier; further right in the throttle row means power came later. The reference lap's dots are outlined, not filled.",
            lookFor: [
                "A lap braking noticeably earlier than the reference with no time gained elsewhere in the corner",
                "Throttle dots clustered tightly across laps — a sign the exit is already close to optimal",
            ],
        },
        isEmpty: emptyWhenNoCorners(2),
        render: ctx => createElement(BrakingPointsPlot, { ctx }),
    },
    {
        key: "sector-heatmap",
        title: "Sector heatmap",
        shortTitle: "Sectors",
        description: "Every selected lap's sector times, coloured by delta to the best sector among them.",
        category: "pace",
        minLaps: 2,
        explainer: {
            what: "A lap × sector grid where each cell's colour shows how that sector time compares to the best sector time recorded by any of the selected laps.",
            howToRead: "Green cells are close to (or are) the best sector; red cells lost the most time in that sector.",
            lookFor: [
                "A lap that's all-green in one sector but red elsewhere — the pace is there, just not everywhere at once",
                "A sector that's red across every lap — a place to focus practice",
            ],
        },
        isEmpty: emptyWhenMissing(2),
        render: ctx => createElement(SectorHeatmapPlot, { ctx }),
    },
    {
        key: "speed-gear",
        title: "Speed & gear",
        shortTitle: "Speed/gear",
        description: "Speed over distance for every lap, with the reference lap's gear shown beneath it.",
        category: "pace",
        minLaps: 2,
        requiresChannels: ["speed", "gear"],
        explainer: {
            what: "Every lap's speed traced against distance, with a gear pane underneath showing which gear the reference lap used at each point.",
            howToRead: "Traces that separate mid-corner or on a straight show where one lap is simply carrying more speed.",
            lookFor: [
                "A lap short-shifting — its speed trace flattens earlier under acceleration than the others",
                "Gear changes that don't line up with a speed dip — a missed downshift",
            ],
        },
        isEmpty: emptyWhenMissing(2, ["speed", "gear"]),
        render: ctx => createElement(SpeedGearPlot, { ctx }),
    },
    {
        key: "friction-overlay",
        title: "Friction circle overlay",
        shortTitle: "Friction circle",
        description: "Lateral vs longitudinal G for every lap, overlaid to compare how fully each fills the tyre's grip.",
        category: "inputs",
        minLaps: 2,
        requiresChannels: ["gLat", "gLong"],
        isPro: true,
        explainer: {
            what: "Every lap's lateral-vs-longitudinal G plotted as a scatter, coloured by lap, over the same axes.",
            howToRead:
                "A driver combining braking and cornering fills a rounder shape; one who brakes in a straight line and only then turns leaves the diagonals empty.",
            lookFor: [
                "One lap's cloud sitting visibly inside another's — that lap isn't using all the grip available",
                "A cross-shaped gap in a lap's cloud where the diagonals should be — no trail braking",
            ],
        },
        isEmpty: emptyWhenMissing(2, ["gLat", "gLong"]),
        render: ctx => createElement(FrictionOverlayPlot, { ctx }),
    },
    {
        key: "tyre-per-lap",
        title: "Tyre temperatures",
        shortTitle: "Tyres",
        description: "Front-left, front-right, rear-left and rear-right tyre temperature (or pressure) over distance.",
        category: "car",
        minLaps: 2,
        requiresChannels: ["tyreTemp_fl", "tyreTemp_fr", "tyreTemp_rl", "tyreTemp_rr"],
        isPro: true,
        explainer: {
            what: "Four small panels, one per corner of the car, tracing that tyre's temperature (or pressure, via the toggle) against distance for every lap.",
            howToRead: "Higher lines mean a hotter (or higher-pressure) tyre at that point on track.",
            lookFor: [
                "One corner running consistently hotter than the other three — a setup or line imbalance",
                "Temperature climbing lap over lap without settling — the tyre isn't reaching a stable window",
            ],
        },
        isEmpty: emptyWhenMissing(2, ["tyreTemp_fl", "tyreTemp_fr", "tyreTemp_rl", "tyreTemp_rr"]),
        render: ctx => createElement(TyrePerLapPlot, { ctx }),
    },
    {
        key: "fuel-per-lap",
        title: "Fuel per lap",
        shortTitle: "Fuel",
        description: "Fuel consumed on each lap alongside that lap's time.",
        category: "car",
        minLaps: 2,
        requiresChannels: ["fuel"],
        isPro: true,
        explainer: {
            what: "A bar per lap showing fuel used (first reading minus last), with a line tracking lap time across the same laps.",
            howToRead: "Taller bars burned more fuel; watch whether a heavier-fuel lap is also a slower one.",
            lookFor: [
                "Fuel use climbing while lap time stays flat — more aggressive throttle without a lap-time payoff",
                "A lap that's both light on fuel and fast — the target to repeat",
            ],
        },
        isEmpty: emptyWhenMissing(2, ["fuel"]),
        render: ctx => createElement(FuelPerLapPlot, { ctx }),
    },
    {
        key: "lap-consistency",
        title: "Lap consistency",
        shortTitle: "Consistency",
        description: "Lap times across the selected laps, with a rolling average for the trend.",
        category: "pace",
        minLaps: 2,
        explainer: {
            what: "The lap time of each selected lap plotted in order, with a 3-lap rolling average line and the best lap marked.",
            howToRead: "A flat trace close to the average means consistent pace; spikes mark scrappy or interrupted laps.",
            lookFor: [
                "A steadily falling trend — still finding pace across the run",
                "One outlier lap far from the rest — usually a mistake or traffic, worth excluding from analysis",
            ],
        },
        isEmpty: emptyWhenMissing(2),
        render: ctx => createElement(LapConsistencyPlot, { ctx }),
    },
];
