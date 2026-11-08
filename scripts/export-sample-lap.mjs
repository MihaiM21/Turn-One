#!/usr/bin/env node
/**
 * Bake a real lap from a Turn One Link protocol-v2 log into a small JSON file for
 * the landing page ("Real lap recorded with Turn One Link").
 *
 * Usage:
 *   node scripts/export-sample-lap.mjs --file "<dev_logs>/telemetry_*.jsonl" \
 *     [--lap 2] [--ref 3] [--car "Ferrari 488 GT3"] [--step 10] \
 *     [--out turn-one-client/public/samples/sample-lap.json]
 *
 * --lap is the lap shown, --ref the lap it is compared against (default: the fastest
 * valid lap). Both default to valid, non-pit laps from `lap_complete`. Only telemetry
 * goes into the file: no driver name, session id or account data.
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const args = Object.fromEntries(
    process.argv.slice(2).reduce((acc, a, i, arr) => {
        if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1]?.startsWith("--") ? true : arr[i + 1] ?? true]);
        return acc;
    }, []),
);
if (!args.file) {
    console.error("Provide --file <path to a Link telemetry_*.jsonl>");
    process.exit(1);
}
const step = Number(args.step ?? 10);
const out = args.out ?? path.join("turn-one-client", "public", "samples", "sample-lap.json");

const SIM_LABEL = { acc: "ACC", ac: "Assetto Corsa", iracing: "iRacing", f1_25: "F1 25", f1_26: "F1 26" };

let start = null;
const laps = new Map(); // lap -> ticks
const complete = new Map(); // lap -> lap_complete data

const rl = readline.createInterface({ input: fs.createReadStream(args.file) });
for await (const line of rl) {
    if (!line) continue;
    let msg;
    try {
        msg = JSON.parse(line);
    } catch {
        continue;
    }
    if (msg.type === "session_start" && !start) start = msg.data;
    if (msg.type === "lap_complete") complete.set(msg.data.lap, msg.data);
    if (msg.type === "tick") {
        const t = msg.data;
        if (!laps.has(t.lap)) laps.set(t.lap, []);
        laps.get(t.lap).push(t);
    }
}

if (!start) throw new Error("No session_start in this log");
const trackLength = start.trackLengthM;
if (!trackLength) throw new Error("session_start has no trackLengthM; pick a log with a known track length");

const valid = [...complete.values()].filter(l => l.valid && !l.pit && l.lapTimeMs > 0);
if (valid.length < 2) throw new Error("Need at least two valid laps");
const fastest = valid.reduce((a, b) => (b.lapTimeMs < a.lapTimeMs ? b : a));
const refLap = Number(args.ref ?? fastest.lap);
const showLap = Number(args.lap ?? valid.filter(l => l.lap !== refLap).reduce((a, b) => (b.lapTimeMs < a.lapTimeMs ? b : a)).lap);

/** Resample a lap's ticks onto a fixed distance grid (linear interpolation, monotonic distance only). */
function resample(lap) {
    const ticks = (laps.get(lap) ?? []).filter(t => Number.isFinite(t.lapDistM) && t.lapDistM >= 0);
    const clean = [];
    for (const t of ticks) if (!clean.length || t.lapDistM > clean[clean.length - 1].lapDistM) clean.push(t);
    if (clean.length < 100) throw new Error(`Lap ${lap} has too few ticks`);
    const grid = [];
    let j = 0;
    for (let d = 0; d <= trackLength; d += step) {
        while (j < clean.length - 2 && clean[j + 1].lapDistM < d) j++;
        const a = clean[j];
        const b = clean[j + 1];
        const f = b.lapDistM === a.lapDistM ? 0 : Math.min(1, Math.max(0, (d - a.lapDistM) / (b.lapDistM - a.lapDistM)));
        const lerp = k => a[k] + (b[k] - a[k]) * f;
        grid.push({
            d,
            t: lerp("lapTimeMs"),
            px: lerp("posX"),
            py: lerp("posY"),
            pz: lerp("posZ"),
            speed: lerp("speed"),
            throttle: lerp("throttle"),
            brake: lerp("brake"),
            gear: f < 0.5 ? a.gear : b.gear,
        });
    }
    return grid;
}

const show = resample(showLap);
const ref = resample(refLap);
const n = Math.min(show.length, ref.length);

// The protocol doc says y is up, but ACC logs carry height in posZ. Use the two axes
// that actually span the track as the ground plane.
const span = k => Math.max(...ref.map(p => p[k])) - Math.min(...ref.map(p => p[k]));
const [ax, az] = ["px", "py", "pz"].sort((a, b) => span(b) - span(a));
for (const p of ref) {
    p.x = p[ax];
    p.z = p[az];
}
// Normalise the map to a 0..1000 box, flipped so it reads like the in-game map.
const xs = ref.map(p => p.x);
const zs = ref.map(p => p.z);
const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
const scale = 1000 / Math.max(maxX - minX, maxZ - minZ);
const r1 = v => Math.round(v * 10) / 10;

const sample = {
    note: "Real lap recorded with Turn One Link. Telemetry only; no driver or account data.",
    sim: SIM_LABEL[start.source] ?? start.source,
    track: start.trackName,
    car: typeof args.car === "string" ? args.car : start.car?.name ?? null,
    trackLengthM: trackLength,
    recordedAt: new Date(start.startedAt).toISOString().slice(0, 10),
    stepM: step,
    lap: { number: showLap, timeMs: complete.get(showLap).lapTimeMs, sectorsMs: complete.get(showLap).sectorsMs },
    ref: { number: refLap, timeMs: complete.get(refLap).lapTimeMs, sectorsMs: complete.get(refLap).sectorsMs },
    map: {
        x: ref.slice(0, n).map(p => Math.round((p.x - minX) * scale)),
        y: ref.slice(0, n).map(p => Math.round((maxZ - p.z) * scale)),
    },
    channels: {
        speed: show.slice(0, n).map(p => Math.round(p.speed)),
        throttle: show.slice(0, n).map(p => Math.round(p.throttle * 100)),
        brake: show.slice(0, n).map(p => Math.round(p.brake * 100)),
        gear: show.slice(0, n).map(p => p.gear),
        refSpeed: ref.slice(0, n).map(p => Math.round(p.speed)),
        // Positive = the shown lap is behind the reference at this distance.
        deltaS: show.slice(0, n).map((p, i) => r1((p.t - ref[i].t) / 100) / 10),
    },
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(sample));
console.log(
    `Wrote ${out}: ${sample.sim} ${sample.track}, lap ${showLap} (${sample.lap.timeMs} ms) vs lap ${refLap} (${sample.ref.timeMs} ms), ${n} points, ${fs.statSync(out).size} bytes`,
);
