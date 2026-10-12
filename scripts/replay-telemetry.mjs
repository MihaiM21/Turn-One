#!/usr/bin/env node
/**
 * Streams a synthetic protocol-v2 sim session into the backend over the telemetry WebSocket,
 * so the ingestion → lap processor → API pipeline can be verified without a sim or the Link.
 *
 * Usage:
 *   node scripts/replay-telemetry.mjs --email you@x.com --password secret [--laps 3] [--track spa] [--realtime]
 *   node scripts/replay-telemetry.mjs --token <jwt> --file "path/to/dev_logs/session.jsonl"   # replay a Link log
 *   --nodist   send lapDistM: 0 on every tick (a Link that doesn't know the track length) to exercise speed integration
 *
 * Env: BACKEND_URL (default http://localhost:5271). Node 22+ (global WebSocket, fetch).
 */

import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const args = Object.fromEntries(
    process.argv.slice(2).reduce((acc, a, i, arr) => {
        if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1]?.startsWith("--") || arr[i + 1] === undefined ? true : arr[i + 1]]);
        return acc;
    }, [])
);

const backend = (process.env.BACKEND_URL ?? "http://localhost:5271").replace(/\/$/, "");
const wsUrl = backend.replace(/^http/, "ws") + "/api/ws/telemetry";

const TRACKS = {
    spa: { id: "spa", name: "Spa-Francorchamps", length: 7004 },
    monza: { id: "monza", name: "Monza", length: 5793 },
    synth: { id: "synth", name: "Synthetic Ring", length: 4000 },
};

async function login() {
    if (args.token) return args.token;
    if (!args.email || !args.password) throw new Error("Provide --token or --email/--password");
    const res = await fetch(`${backend}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: args.email, password: args.password }),
    });
    if (!res.ok) throw new Error(`login failed: ${res.status} ${await res.text()}`);
    const body = await res.json();
    return body.token ?? body.accessToken ?? body.data?.token;
}

// ---- synthetic lap (mirrors turn-one-backend/Tests/Fixtures/SyntheticLap.cs) -------------------

const CORNERS = [
    [420, 95, 1], [880, 140, -1], [1300, 70, 1], [1750, 160, -1],
    [2250, 110, 1], [2700, 85, -1], [3150, 175, 1], [3600, 100, -1],
].map(([apex, minV, dir]) => ({ apex, minV, dir, brake: 120 }));

function scaledCorners(length) {
    const k = length / 4000;
    return CORNERS.map(c => ({ ...c, apex: c.apex * k }));
}

function targetSpeed(d, corners, straight, scale) {
    let v = straight;
    for (const c of corners) {
        const minV = c.minV * scale;
        const bs = c.apex - c.brake;
        if (d >= bs && d <= c.apex) v = Math.min(v, straight + (minV - straight) * ((d - bs) / c.brake));
        else if (d > c.apex && d <= c.apex + 220) v = Math.min(v, minV + (straight - minV) * Math.sqrt((d - c.apex) / 220));
    }
    return v;
}
const gLat = (d, corners) => corners.reduce((g, c) => { const x = (d - c.apex) / 45; return Math.abs(x) < 1.6 ? g + c.dir * 1.6 * Math.exp(-x * x * 2) : g; }, 0);
const brakeAt = (d, corners) => { for (const c of corners) { const bs = c.apex - c.brake, be = c.apex - 15; if (d >= bs && d <= be) { const w = (d - bs) / (be - bs); return w < 0.15 ? w / 0.15 : 1 - 0.5 * w; } } return 0; };
const throttleAt = (d, corners) => { for (const c of corners) { if (d >= c.apex - c.brake && d < c.apex - 5) return 0; if (d >= c.apex - 5 && d <= c.apex + 60) return Math.min(1, (d - (c.apex - 5)) / 65); } return 1; };

function* syntheticSession({ track, laps, hz = 20, scaleStep = 0.02 }) {
    const corners = scaledCorners(track.length);
    const sessionId = randomUUID().replace(/-/g, "");
    const t0 = Date.now();
    let t = 0;
    const env = (type, data) => ({ v: 2, type, sessionId, timestamp: t0 + Math.round(t), data });

    yield env("session_start", {
        source: "acc", trackId: track.id, trackName: track.name, trackLengthM: track.length, sectorCount: 3,
        car: { id: "ferrari_296_gt3", name: "Ferrari 296 GT3", class: "GT3" }, sessionType: "practice",
        sessionTypeRaw: "AC_PRACTICE", driver: "Replay Driver", tickRateHz: hz, startedAt: t0,
    });

    let fuel = 60;
    for (let lap = 1; lap <= laps; lap++) {
        const scale = 1 - scaleStep * ((lap - 1) % 3); // lap 1 = reference pace, then slower variants
        let d = 0, lapMs = 0, speed = targetSpeed(0, corners, 230, scale);
        const dt = 1 / hz;
        while (d < track.length) {
            const g = gLat(d, corners);
            const ang = (d / track.length) * 2 * Math.PI;
            yield env("tick", {
                lap, lapTimeMs: Math.round(lapMs), lapDistM: args.nodist ? 0 : +d.toFixed(2), sector: Math.min(2, Math.floor((d / track.length) * 3)),
                speed: +speed.toFixed(2), rpm: Math.round(4000 + speed * 20), gear: Math.min(6, Math.max(1, Math.ceil(speed / 40))),
                throttle: +throttleAt(d, corners).toFixed(3), brake: +brakeAt(d, corners).toFixed(3), clutch: 0,
                steer: +(g / 2.2).toFixed(3), gLat: +g.toFixed(3), gLong: 0, posX: +(Math.cos(ang) * 600).toFixed(2), posY: +(Math.sin(ang) * 600).toFixed(2),
                heading: +(ang + Math.PI / 2).toFixed(4), valid: true, pit: 0, fuel: +fuel.toFixed(3),
                tyreTemp: [88, 89, 86, 87], tyrePress: [27.5, 27.4, 27.1, 27.2], frame: Math.round(t / 50),
            });
            d += (speed / 3.6) * dt; lapMs += dt * 1000; t += dt * 1000; fuel -= 0.0009;
            const target = targetSpeed(d, corners, 230, scale);
            const maxStep = (target < speed ? 55 : 30) * dt;
            speed = Math.abs(target - speed) <= maxStep ? target : speed + Math.sign(target - speed) * maxStep;
        }
        const s1 = Math.round(lapMs * 0.33), s2 = Math.round(lapMs * 0.34);
        yield env("lap_complete", { lap, lapTimeMs: Math.round(lapMs), sectorsMs: [s1, s2, Math.round(lapMs) - s1 - s2], valid: true, pit: false, lapDistM: track.length });
    }
    yield env("session_end", { sessionId, endedAt: t0 + Math.round(t), lapsCompleted: laps, bestLapMs: 0 });
}

function* fileSession(path) {
    for (const line of readFileSync(path, "utf8").split("\n")) {
        if (!line.trim()) continue;
        yield JSON.parse(line);
    }
}

async function main() {
    const token = await login();
    const ws = new WebSocket(`${wsUrl}?access_token=${encodeURIComponent(token)}`);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = e => reject(new Error(`ws error: ${e.message ?? e}`)); });
    console.log(`connected to ${wsUrl}`);

    const track = TRACKS[args.track ?? "synth"] ?? TRACKS.synth;
    const frames = args.file ? fileSession(args.file) : syntheticSession({ track, laps: Number(args.laps ?? 3) });
    let n = 0, sessionId = null, lastTs = null;
    for (const frame of frames) {
        sessionId ??= frame.sessionId;
        if (args.realtime && lastTs != null) await new Promise(r => setTimeout(r, Math.max(0, frame.timestamp - lastTs)));
        lastTs = frame.timestamp;
        ws.send(JSON.stringify(frame));
        if (++n % 500 === 0) { process.stdout.write(`\r${n} frames`); await new Promise(r => setTimeout(r, 5)); }
    }
    console.log(`\nsent ${n} frames for session ${sessionId}`);
    await new Promise(r => setTimeout(r, 4000)); // let the lap processor drain
    ws.close();

    const res = await fetch(`${backend}/api/telemetry/sessions/${sessionId}/laps`, { headers: { Authorization: `Bearer ${token}` } });
    const laps = res.ok ? await res.json() : [];
    console.table(laps.map(l => ({ lap: l.lapNumber, time: l.lapTimeMs, valid: l.isValid, kind: l.kind, status: l.processingStatus, telemetry: l.hasTelemetry })));
    const first = laps.find(l => l.hasTelemetry);
    if (first) {
        const tel = await fetch(`${backend}/api/telemetry/laps/${first.id}/telemetry?step=4`, { headers: { Authorization: `Bearer ${token}` } });
        const dto = tel.ok ? await tel.json() : null;
        if (dto) console.log(`lap ${dto.lapNumber}: ${dto.sampleCount} samples @ ${dto.stepM} m, channels: ${Object.keys(dto.channels).join(", ")}, corners: ${dto.corners.length}`);
        else console.log(`telemetry fetch failed: ${tel.status}`);
    }
    console.log(`open: /simracing/analysis?track=<profile>&ref=${first?.id ?? ""}`);
}

main().catch(e => { console.error(e); process.exit(1); });
