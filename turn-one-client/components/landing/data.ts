/**
 * Copy + content for the root landing page (`/`). One place to edit wording;
 * the hero, hotspots, sector rows, FAQ and JSON-LD all read from here.
 */

export type PillarId = "live" | "telemetry" | "play" | "hub";

export type Pillar = {
  id: PillarId;
  /** Hotspot anchor on the 2026 model, metres, +Z = nose, Y up */
  anchor: [number, number, number];
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
};

export const HERO = {
  eyebrow: "Turn One · Formula One intelligence",
  h1: "See the race the way the pit wall does.",
  sub: "Live timing, telemetry that explains itself, and race predictions — in one place, on any screen.",
  primary: { label: "Watch live — free", href: "/live" },
  secondary: { label: "Create account", href: "/auth/signup" },
  tertiary: { label: "See every feature", href: "/features" },
};

export const PILLARS: Pillar[] = [
  {
    id: "live",
    anchor: [0, 0.95, -2.3],
    eyebrow: "Rear wing · Active aero",
    title: "F1 Live",
    body: "Timing tower, gaps, tyre age and sector times — streamed the moment it happens. No spoilers, no thumbnails, no delay.",
    href: "/live",
    cta: "Open live timing",
  },
  {
    id: "telemetry",
    anchor: [1.08, 0.22, 0.3],
    eyebrow: "Floor · Engine cover",
    title: "Telemetry, explained",
    body: "Throttle, brake and speed traces for every lap since 2020 — with the why written next to the chart, not left to you.",
    href: "/f1",
    cta: "Browse session telemetry",
  },
  {
    id: "play",
    anchor: [0, 0.98, 0.5],
    eyebrow: "Cockpit · Your inputs",
    title: "Predict & play",
    body: "Call the podium, beat the trivia clock, climb the leaderboard. Coins, tokens and daily gifts keep the weekend alive.",
    href: "/dashboard/predictions",
    cta: "Make a prediction",
  },
  {
    id: "hub",
    anchor: [0, 0.78, 2.45],
    eyebrow: "Nose · Front wing",
    title: "One dashboard",
    body: "Next session countdown, latest results, your streak and your rewards — one screen that refreshes every lap.",
    href: "/dashboard",
    cta: "Open the dashboard",
  },
];

/**
 * The 2026 technical rules, stated plainly, and what each one looks like in the
 * data. Figures are from the FIA 2026 technical regulations.
 */
export const REGS_2026 = [
  {
    k: "Active aero",
    v: "Corner / Straight",
    body: "Front and rear wings flatten on designated straights and close again for the corners. DRS is gone.",
    where: "Top speed jumps on the straights where Straight Mode is allowed.",
  },
  {
    k: "Overtake Mode",
    v: "< 1.0 s",
    body: "Within a second of the car ahead, a driver gets extra electrical deployment to attack — the new push-to-pass.",
    where: "Gaps under 1.0 s on the timing tower are where attacks start.",
  },
  {
    k: "Electric power",
    v: "350 kW",
    body: "The MGU-K nearly triples, from 120 kW, and the MGU-H is gone. Energy management now decides races.",
    where: "Speed tapering before a braking point is a car running out of deployment.",
  },
  {
    k: "Smaller car",
    v: "768 kg · 3.4 m",
    body: "Lighter, 200 mm shorter in wheelbase and 100 mm narrower than the 2022–25 cars.",
    where: "Put the same circuit side by side in the 2025 and 2026 session archive.",
  },
];

export const FAQ = [
  {
    q: "Is Turn One free?",
    a: "Yes. Live timing, current-season analysis, predictions and trivia are free on the Enthusiast plan. Professional adds the 2020–2025 archive, exports and deeper AI insights.",
  },
  {
    q: "Does it work during a live session?",
    a: "That's the point. Timing, gaps, tyre stints and sector times update in real time over a WebSocket connection while the session runs.",
  },
  {
    q: "Is Turn One updated for the 2026 regulations?",
    a: "Yes. The 2026 calendar, sessions and results are covered, and the guide on this page explains what the new rules — active aero, Overtake Mode instead of DRS, and 350 kW of electric power — change in the data.",
  },
  {
    q: "Where does the data come from?",
    a: "Official live timing feeds during sessions, and the FastF1/OpenF1 archives for every session from 2020 onwards. Turn One is not affiliated with Formula 1.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. It runs in the browser on desktop, tablet and phone. A desktop overlay app is available separately for stream setups.",
  },
  {
    q: "What makes it different from other F1 dashboards?",
    a: "Charts are everywhere. Turn One explains them — every trace comes with the reasoning next to it — and wraps the weekend in predictions and rewards.",
  },
];

/** Mirrors app/(site)/pricing — used only for the SoftwareApplication offers in JSON-LD. */
export const PLANS = [
  { name: "Enthusiast", price: "0" },
  { name: "Professional", price: "9.99" },
  { name: "Elite", price: "19.99" },
];

/** The 2026 Turn One car. Model optimised from public/turn-one-car/2026-turn-one-car/2026_TurnOneCar.glb
 *  (25 MB → 1.4 MB: draco, 40% simplify, 1K WebP textures).
 *  Posters are rendered from the live scene at its start camera (Corner mode, no view offset):
 *  landscape 1920×1080 at 32° FOV, portrait 1080×1920 at 50°. Re-render them if the camera,
 *  lighting or tunnel dressing change, or the fade-in will jump. */
export const CAR = {
  model: "/models/turn-one-car/2026-turn-one-car.glb",
  draco: "/draco/",
  posters: {
    landscape: "/turn-one-car/2026-turn-one-car/tunnel-landscape.webp",
    portrait: "/turn-one-car/2026-turn-one-car/tunnel-portrait.webp",
  },
};
