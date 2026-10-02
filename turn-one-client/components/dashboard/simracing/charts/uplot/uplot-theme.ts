import type uPlot from "uplot";
import { CHART, formatDistance } from "../chart-theme";

/**
 * Display metadata for the protocol-v2 channels the trace panes can show. Kept local to the uPlot
 * layer (rather than importing the full registry mirror) so the chart bundle stays small and the
 * colours read as one system with the Recharts panels next to it.
 */
export interface PaneMeta {
    label: string;
    unit: string;
    color: string;
    /** Fixed y range (after `scale`). */
    range?: [number, number];
    /** Multiply raw values before display (0–1 → %). */
    scale?: number;
    /** Sample-and-hold rendering and integer ticks. */
    discrete?: boolean;
    /** Centre the range on zero and draw a zero line (steering, g). */
    symmetric?: boolean;
    /** Relative pane height; speed gets more room, flags less. */
    weight?: number;
}

export const PANE_META: Record<string, PaneMeta> = {
    speed: { label: "Speed", unit: "km/h", color: "#ef4444", weight: 1.5 },
    throttle: { label: "Throttle", unit: "%", color: "#22c55e", range: [0, 100], scale: 100 },
    brake: { label: "Brake", unit: "%", color: "#f97316", range: [0, 100], scale: 100 },
    clutch: { label: "Clutch", unit: "%", color: "#eab308", range: [0, 100], scale: 100 },
    steer: { label: "Steering", unit: "", color: "#06b6d4", range: [-1, 1], symmetric: true },
    gear: { label: "Gear", unit: "", color: "#a855f7", discrete: true, weight: 0.8 },
    rpm: { label: "RPM", unit: "rpm", color: "#3b82f6" },
    gLat: { label: "Lateral G", unit: "g", color: "#ec4899", symmetric: true },
    gLong: { label: "Long. G", unit: "g", color: "#8b5cf6", symmetric: true },
    fuel: { label: "Fuel", unit: "L", color: "#14b8a6" },
    brakeBias: { label: "Brake bias", unit: "%", color: "#f59e0b" },
    drs: { label: "DRS", unit: "", color: "#10b981", range: [0, 1], discrete: true, weight: 0.5 },
    ers: { label: "ERS store", unit: "kJ", color: "#fbbf24", scale: 0.001 },
    tc: { label: "TC", unit: "", color: "#64748b", discrete: true, weight: 0.6 },
    abs: { label: "ABS", unit: "", color: "#94a3b8", discrete: true, weight: 0.6 },

    tyreTemp_fl: { label: "Tyre FL temp", unit: "°C", color: "#ef4444" },
    tyreTemp_fr: { label: "Tyre FR temp", unit: "°C", color: "#3b82f6" },
    tyreTemp_rl: { label: "Tyre RL temp", unit: "°C", color: "#f97316" },
    tyreTemp_rr: { label: "Tyre RR temp", unit: "°C", color: "#22c55e" },
    tyrePress_fl: { label: "Tyre FL pressure", unit: "psi", color: "#ef4444" },
    tyrePress_fr: { label: "Tyre FR pressure", unit: "psi", color: "#3b82f6" },
    tyrePress_rl: { label: "Tyre RL pressure", unit: "psi", color: "#f97316" },
    tyrePress_rr: { label: "Tyre RR pressure", unit: "psi", color: "#22c55e" },
};

/** Default pane order for the analysis workspace; the first three are on by default. */
export const DEFAULT_PANES = ["speed", "throttle", "brake", "steer", "gear", "rpm", "gLat"] as const;

export const UPLOT_FONT = "11px ui-monospace, SFMono-Regular, Menlo, monospace";

/** Shared geometry so the ribbon, every pane and the delta chart line up pixel for pixel. */
export const PANE_LAYOUT = {
    /** Width reserved for the value axis on the left of each pane. */
    axisWidth: 52,
    /** Right padding so the last x tick label isn't clipped. */
    padRight: 12,
    /** Top padding inside the canvas — enough for the topmost tick label to breathe. */
    padTop: 8,
    /** Height of the distance axis strip on the bottom pane. */
    xAxisHeight: 28,
    /** Height of the corner / sector ribbon. */
    ribbonHeight: 30,
} as const;

/** Shared cursor-sync key — every pane and the delta chart join this group. */
export const SYNC_KEY = "t1-lap-distance";

export function distanceAxis(): uPlot.Axis {
    return {
        stroke: CHART.axis,
        font: UPLOT_FONT,
        size: PANE_LAYOUT.xAxisHeight,
        gap: 4,
        grid: { stroke: CHART.grid, width: 1 },
        ticks: { stroke: CHART.grid, width: 1, size: 4 },
        values: (_u, splits) => splits.map(v => formatDistance(v)),
    };
}

export function valueAxis(_unit: string, opts: { size?: number; discrete?: boolean } = {}): uPlot.Axis {
    return {
        stroke: CHART.axis,
        font: UPLOT_FONT,
        size: opts.size ?? PANE_LAYOUT.axisWidth,
        gap: 6,
        grid: { stroke: CHART.grid, width: 1 },
        ticks: { stroke: CHART.grid, width: 1, size: 4 },
        incrs: opts.discrete ? [1, 2] : undefined,
        // Integer ticks for discrete channels; the unit lives in the pane header, not on every tick.
        values: (_u, splits) => splits.map(v => (Number.isFinite(v) ? (opts.discrete ? String(Math.round(v)) : trimNumber(v)) : "")),
    };
}

export function trimNumber(v: number) {
    const abs = Math.abs(v);
    if (abs >= 1000) return v.toFixed(0);
    if (abs >= 100) return v.toFixed(0);
    if (abs >= 10) return v.toFixed(1);
    return v.toFixed(2).replace(/\.?0+$/, "");
}

export const CURSOR_BASE: uPlot.Cursor = {
    x: true,
    y: false,
    lock: false,
    points: { size: 6, width: 1.5, fill: "#0a0a0a" },
    drag: { x: true, y: false, setScale: true, uni: 24 },
    sync: { key: SYNC_KEY, setSeries: false },
};

/** Semi-transparent band colours for corner shading, keyed by direction. */
export const CORNER_BAND = {
    right: "rgba(59,130,246,0.10)",
    left: "rgba(236,72,153,0.10)",
    label: "#a1a1aa",
    sector: "rgba(161,161,170,0.45)",
    sectorLabel: "#71717a",
    brakingMarker: "#f97316",
    throttleMarker: "#22c55e",
} as const;
