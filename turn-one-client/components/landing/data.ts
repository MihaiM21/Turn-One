/**
 * Copy + content for the root landing page (`/`), sim-first since 2026-11-08
 * (grill G7/G9). One place to edit wording; the hero, hotspots, sections, FAQ
 * and JSON-LD all read from here.
 *
 * Honesty rules (docs/LANDING_PAGE_REDESIGN_RESEARCH.md): no invented numbers or
 * testimonials, and nothing that says Link can be downloaded today — it is in
 * closed beta.
 */

export type PillarId = "link" | "analysis" | "compete" | "broadcast";

export type Pillar = {
  id: PillarId;
  /** Hotspot anchor on the car model, metres, +Z = nose, Y up */
  anchor: [number, number, number];
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
};

export const BETA_SIGNUP_HREF = "/auth/signup?intent=beta";

export const HERO = {
  eyebrow: "Turn One · Sim racing telemetry",
  h1: "Find the tenth in every corner.",
  sub: "Turn One Link records every lap you drive in ACC, EA SPORTS F1 25 and F1 26, and iRacing. The web shows where you lose time, corner by corner, against your best and the leaderboard.",
  primary: { label: "Join the beta", href: BETA_SIGNUP_HREF },
  secondary: { label: "How Link works", href: "#how" },
  tertiary: { label: "See every feature", href: "/features" },
};

export const PILLARS: Pillar[] = [
  {
    id: "link",
    anchor: [0, 0.98, 0.5],
    eyebrow: "Cockpit · Turn One Link",
    title: "Every lap, recorded",
    body: "A small Windows app reads the telemetry your sim already publishes, keeps every session on your PC and uploads finished laps. No in-game overlay, nothing injected into the game.",
    href: "#how",
    cta: "How Link works",
  },
  {
    id: "analysis",
    anchor: [1.08, 0.22, 0.3],
    eyebrow: "Floor · Where the time goes",
    title: "Corner by corner",
    body: "Overlay any two laps on distance: speed, throttle, brake, gear and the running delta. The gaps that matter are found for you, so you know which corner to work on next.",
    href: "#lap",
    cta: "See a real lap",
  },
  {
    id: "compete",
    anchor: [0, 0.95, -2.3],
    eyebrow: "Rear wing · Leaderboards",
    title: "Verified leaderboards",
    body: "Best valid laps per sim, track and car, checked on the server: sector sum, track length and plausible speed. Drivers can stay anonymous or hide.",
    href: "#leaderboard",
    cta: "See the leaderboards",
  },
  {
    id: "broadcast",
    anchor: [0, 0.78, 2.45],
    eyebrow: "Nose · On stream",
    title: "Overlays for streamers",
    body: "Browser-source overlays for OBS — cockpit, lap timer and leaderboard — fed live from your Link session.",
    href: "#broadcast",
    cta: "Overlays for OBS",
  },
];

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Install Turn One Link",
    body: "Windows 10 or 11. Pair it with your account once by approving a code on the website.",
  },
  {
    step: "02",
    title: "Drive",
    body: "Open your sim and drive. Link records every lap on your PC and uploads finished laps, retrying if your connection drops.",
  },
  {
    step: "03",
    title: "Analyse on the web",
    body: "Your sessions, laps and personal bests appear in your dashboard, ready to compare against your best and the leaderboard.",
  },
];

export const FAQ = [
  {
    q: "Which sims work?",
    a: "Assetto Corsa Competizione, EA SPORTS F1 25 and F1 26 (PC, and PS5 or Xbox over your network), and iRacing. Original Assetto Corsa is experimental: laps are recorded but don't rank yet.",
  },
  {
    q: "What does Turn One Link read from my PC?",
    a: "Only the telemetry each sim publishes for dashboards: ACC's shared memory, the iRacing SDK feed, or the UDP feed you switch on in F1. It doesn't read game files, inject into the game or see anything else on your PC.",
  },
  {
    q: "Does it touch the game?",
    a: "No. Link only reads the telemetry interfaces dashboards and wheel apps already use, and never writes to the game or its memory.",
  },
  {
    q: "Can I use it on PlayStation or Xbox?",
    a: "Yes, for F1 25 and F1 26: the console sends its UDP telemetry to Link running on a PC on the same network. ACC on console doesn't publish telemetry, and iRacing is PC only.",
  },
  {
    q: "Who can see my laps?",
    a: "Your sessions are private until you share them. Best valid laps appear on leaderboards under your name, anonymously, or not at all — your choice.",
  },
  {
    q: "What does it cost?",
    a: "Recording, your own lap analysis and the leaderboards are free. Paid plans add comparing against other drivers' laps, the corner coach, spectating and overlays. Paid plans aren't on sale yet.",
  },
  {
    q: "When can I download Turn One Link?",
    a: "It's in closed beta for 20–50 drivers from January 2027. Join the beta with your sims and setup; the decision shows up in your dashboard.",
  },
];

/** Mirrors app/(site)/pricing — used only for the SoftwareApplication offers in JSON-LD. */
export const PLANS = [
  { name: "Enthusiast", price: "0" },
  { name: "Professional", price: "9.99" },
  { name: "Elite", price: "19.99" },
];

/** The Turn One car. Model optimised from public/turn-one-car/2026-turn-one-car/2026_TurnOneCar.glb
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
