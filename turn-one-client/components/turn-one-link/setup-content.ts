import { Download, LogIn, Gauge, Flag, type LucideIcon } from "lucide-react";

export interface SetupStep {
    icon: LucideIcon;
    title: string;
    description: string;
}

/** Shared by the public download page and the compact in-dashboard version. */
export const SETUP_STEPS: SetupStep[] = [
    {
        icon: Download,
        title: "Install Turn One Link",
        description:
            "Download the installer and run it. Windows SmartScreen may warn on first launch — choose More info → Run anyway.",
    },
    {
        icon: LogIn,
        title: "Sign in",
        description:
            "Use the same Turn One email and password you use on the site. Link stays signed in between sessions.",
    },
    {
        icon: Gauge,
        title: "Launch Assetto Corsa Competizione",
        description:
            "Link detects ACC automatically and starts reading its shared memory. No in-game settings to change.",
    },
    {
        icon: Flag,
        title: "Get on track",
        description:
            "Your live cockpit fills in immediately and every completed lap is saved to your session history for analysis.",
    },
];

export const REQUIREMENTS = [
    { label: "Operating system", value: "Windows 10 (build 19041) or Windows 11" },
    { label: "Runtime", value: ".NET 9 Desktop Runtime (bundled with the installer)" },
    { label: "Game", value: "Assetto Corsa Competizione" },
    { label: "Connection", value: "Broadband — Link streams roughly 40 KB/s while you're on track" },
    { label: "Account", value: "A free Turn One account" },
];

export const PRIVACY_POINTS = {
    sends: [
        "Car physics: speed, RPM, gear, throttle, brake, clutch, steering, G-forces",
        "Session state: lap and sector times, track position, flags, fuel, tyre and brake data",
        "Session metadata: car model, track, your in-game driver name",
        "The Link version number, so we can tell you when an update is available",
    ],
    doesNot: [
        "Read or modify any game files, saves or setups",
        "Capture your screen, microphone, keystrokes or any other application",
        "Share your sessions with anyone — sessions are private until you mark them public",
        "Run in the background when you close it; quitting Link stops the stream immediately",
    ],
};

export const TROUBLESHOOTING = [
    {
        question: "Link says \"Waiting for data\" but I'm on track",
        answer:
            "ACC only writes to shared memory while a session is actually running — not in the menus or on the setup screen. Head out of the pits and the cockpit will fill in. If it still doesn't, restart Link after ACC is already running.",
    },
    {
        question: "Windows SmartScreen blocked the installer",
        answer:
            "New installers take a while to build reputation with Microsoft. Click More info, then Run anyway. You can verify the download first by checking its SHA-256 against the checksum shown on this page.",
    },
    {
        question: "My laps aren't showing up in session history",
        answer:
            "Only completed laps are recorded — the lap you're on mid-session won't appear until you cross the line. Also check that Link still shows Connected; if your network dropped, it reconnects automatically but the in-progress lap may be lost.",
    },
    {
        question: "Can I use it with iRacing, Assetto Corsa or Le Mans Ultimate?",
        answer:
            "Not yet. Turn One Link currently reads Assetto Corsa Competizione's shared memory format. Support for more sims is on the roadmap — tell us which one you want next on Discord.",
    },
    {
        question: "Does it affect my frame rate?",
        answer:
            "No measurable impact. Link reads a block of shared memory that ACC already writes and sends it over a WebSocket; it does not hook into or inject anything into the game.",
    },
    {
        question: "I'm on Mac or Linux",
        answer:
            "Turn One Link is Windows-only because it depends on Windows shared memory. Everything else on Turn One — session analysis, the AI coach, leaderboards, overlays — works in any browser once your laps are uploaded.",
    },
];
