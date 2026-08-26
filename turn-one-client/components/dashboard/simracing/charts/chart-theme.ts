/** Shared Recharts styling so every simracing chart reads as one system. */

export const CHART = {
    grid: "#374151",
    axis: "#9CA3AF",
    primary: "#DC2626",
    reference: "#71717a",
    faster: "#22c55e",
    slower: "#ef4444",
} as const;

export const TOOLTIP_STYLE = {
    backgroundColor: "#1F2937",
    border: "1px solid #374151",
    borderRadius: 0,
    color: "#F9FAFB",
    fontSize: 12,
} as const;

export const AXIS_TICK = { fill: CHART.axis, fontSize: 10 } as const;

/** Channel display metadata, shared by the trace chart and the track map colouring. */
export const CHANNEL_META: Record<string, { label: string; color: string; unit: string; domain?: [number, number] }> = {
    speedKmh: { label: "Speed", color: "#ef4444", unit: "km/h" },
    rpms: { label: "RPM", color: "#3b82f6", unit: "rpm" },
    gas: { label: "Throttle", color: "#22c55e", unit: "%", domain: [0, 100] },
    brake: { label: "Brake", color: "#f97316", unit: "%", domain: [0, 100] },
    gear: { label: "Gear", color: "#a855f7", unit: "" },
    steerAngle: { label: "Steering", color: "#06b6d4", unit: "" },
    clutch: { label: "Clutch", color: "#eab308", unit: "%", domain: [0, 100] },
    accG_x: { label: "Lateral G", color: "#ec4899", unit: "g" },
    accG_y: { label: "Long. G", color: "#8b5cf6", unit: "g" },
    fuel: { label: "Fuel", color: "#14b8a6", unit: "L" },
    brakeBias: { label: "Brake bias", color: "#f59e0b", unit: "%" },
};

/** `1420 m` / `1.4 km` — axis labels stay short at both ends of a lap. */
export function formatDistance(m: number) {
    return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;
}

/**
 * Recharts types tooltip formatter arguments as `ValueType | undefined`, so formatters take
 * `unknown` and coerce through these rather than each chart casting the callback.
 */
export const asNumber = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);
export const asString = (v: unknown): string => (typeof v === "string" ? v : String(v ?? ""));
