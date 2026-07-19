// Shared color-interpolation helpers for custom (non-recharts) visualizations
// like the race pace heatmap and the track map speed/gear overlay.

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const lerpColor = (c1: [number, number, number], c2: [number, number, number], t: number): [number, number, number] => [
  Math.round(lerp(c1[0], c2[0], t)),
  Math.round(lerp(c1[1], c2[1], t)),
  Math.round(lerp(c1[2], c2[2], t)),
];

const toRgb = ([r, g, b]: [number, number, number]) => `rgb(${r}, ${g}, ${b})`;

// Diverging scale for "delta to reference" values (e.g. lap-pace delta to
// field median). Negative (faster) trends green, positive (slower) trends
// red, near-zero is neutral grey.
const COOL: [number, number, number] = [34, 197, 94]; // green-500
const NEUTRAL: [number, number, number] = [113, 113, 122]; // zinc-500
const HOT: [number, number, number] = [239, 68, 68]; // red-500

export function deltaToColor(value: number, maxAbs: number): string {
  if (maxAbs <= 0 || !Number.isFinite(value)) return toRgb(NEUTRAL);
  const t = clamp(value / maxAbs, -1, 1);
  if (t < 0) return toRgb(lerpColor(NEUTRAL, COOL, -t));
  return toRgb(lerpColor(NEUTRAL, HOT, t));
}

// Sequential scale for absolute magnitude values (e.g. speed_kmh along a
// track map). Slow -> cool blue, fast -> hot yellow/red.
const SPEED_SLOW: [number, number, number] = [59, 130, 246]; // blue-500
const SPEED_MID: [number, number, number] = [234, 179, 8]; // yellow-500
const SPEED_FAST: [number, number, number] = [239, 68, 68]; // red-500

export function speedToColor(value: number, min: number, max: number): string {
  if (max <= min) return toRgb(SPEED_MID);
  const t = clamp((value - min) / (max - min), 0, 1);
  if (t < 0.5) return toRgb(lerpColor(SPEED_SLOW, SPEED_MID, t / 0.5));
  return toRgb(lerpColor(SPEED_MID, SPEED_FAST, (t - 0.5) / 0.5));
}

// Discrete categorical colors for gear numbers 1-8.
const GEAR_COLORS: string[] = [
  '#3b82f6', // 1
  '#0ea5e9', // 2
  '#06b6d4', // 3
  '#22c55e', // 4
  '#84cc16', // 5
  '#eab308', // 6
  '#f97316', // 7
  '#ef4444', // 8
];

export function gearToColor(gear: number): string {
  const idx = clamp(Math.round(gear) - 1, 0, GEAR_COLORS.length - 1);
  return GEAR_COLORS[idx];
}

export const LAP_STATUS_COLORS: Record<string, string> = {
  green: '', // no override — cell falls back to the delta-based color
  pit: '#52525b', // zinc-600
  safety_car: '#f59e0b', // amber-500
  red_flag: '#7f1d1d', // red-900
  retired: '#18181b', // zinc-900
};
