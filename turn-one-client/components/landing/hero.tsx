"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CarSceneLazy, useCanRender3D } from "./car-scene-lazy";
import type { AeroMode } from "./car-scene";
import { Poster } from "./poster";
import { LiveStrip } from "./live-strip";
import { Fragment } from "./ui-fragments";
import { Btn, Eyebrow, Plate } from "./sections";
import { HERO, PILLARS, type Pillar } from "./data";
import { cn } from "@/lib/utils";

const MODE_COPY: Record<AeroMode, { wing: string; df: number; drag: number; wind: number }> = {
  // relative bars, not claimed figures: Straight mode trades downforce for a lot less drag
  corner: { wing: "Closed", df: 1, drag: 1, wind: 290 },
  straight: { wing: "Open", df: 0.45, drag: 0.5, wind: 325 },
};

/** SCREEN-layer instrument: mono, tabular, ticks like a real sensor. */
function Readout({ mode }: { mode: AeroMode }) {
  const m = MODE_COPY[mode];
  const [jitter, setJitter] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setJitter(Math.round(Math.random() * 4) - 2), 400);
    return () => clearInterval(id);
  }, []);
  return (
    <dl className="grid w-56 grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 border border-zinc-800 bg-black/70 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 backdrop-blur-sm">
      <dt>Wind</dt>
      <dd className="text-right tabular-nums text-white">{m.wind + jitter} km/h</dd>
      <dt>Rear wing</dt>
      <dd className="text-right text-white">{m.wing}</dd>
      <dt>Downforce</dt>
      <dd><Bar v={m.df} /></dd>
      <dt>Drag</dt>
      <dd><Bar v={m.drag} /></dd>
    </dl>
  );
}

function Bar({ v }: { v: number }) {
  return (
    <span className="block h-1 w-full bg-zinc-800">
      <span className="block h-full bg-zinc-200 transition-[width] duration-500 ease-out" style={{ width: `${v * 100}%` }} />
    </span>
  );
}

/** The 2026 active-aero switch. Auto-alternates to show itself off until someone uses it. */
function AeroSwitch({ mode, onChange }: { mode: AeroMode; onChange: (m: AeroMode) => void }) {
  return (
    <div role="group" aria-label="Active aero mode" className="flex border border-zinc-800 bg-black/70 p-0.5 backdrop-blur-sm">
      {(["corner", "straight"] as const).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => onChange(m)}
          className={cn(
            "min-h-9 flex-1 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors",
            mode === m ? "bg-zinc-100 text-black" : "text-zinc-400 hover:text-white",
          )}
        >
          {m} mode
        </button>
      ))}
    </div>
  );
}

/**
 * The landing hero: the 2026 car in a wind tunnel. Cyan streamlines flow
 * nose → tail over the body on a rolling road; drag to turn the car; the
 * numbered hotspots open each part of the product; the aero switch moves the
 * real wing elements between the 2026 Corner and Straight modes.
 */
export function WindTunnelHero() {
  const can3D = useCanRender3D();
  const [open, setOpen] = useState<Pillar | null>(null);
  const [touched, setTouched] = useState(false);
  const [wide, setWide] = useState(false);
  const [mode, setMode] = useState<AeroMode>("corner");
  const [modeTouched, setModeTouched] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!can3D || modeTouched) return;
    const id = setInterval(() => setMode((m) => (m === "corner" ? "straight" : "corner")), 4500);
    return () => clearInterval(id);
  }, [can3D, modeTouched]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const hotspots = PILLARS.map((p, i) => ({
    id: p.id,
    position: p.anchor,
    label: p.title,
    index: i,
    onClick: () => setOpen(p),
  }));

  return (
    <section aria-labelledby="hero-title" className="relative border-b border-zinc-800 bg-[#020202]">
      <div className="relative h-[100svh] min-h-[600px] w-full overflow-hidden">
        <Poster />
        {can3D && (
          <CarSceneLazy
            aero={mode}
            shiftX={wide ? 0.2 : 0}
            hotspots={hotspots}
            onInteract={() => setTouched(true)}
            className="cursor-grab active:cursor-grabbing"
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black via-black/60 to-transparent lg:h-2/5 lg:from-black/85 lg:via-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/2 bg-gradient-to-r from-black/80 to-transparent lg:block" />

        {/* Copy column */}
        <div className="pointer-events-none absolute inset-0 mx-auto flex w-full max-w-6xl flex-col justify-end px-4 pb-10 sm:px-6 sm:pb-16 lg:justify-center lg:px-8 lg:pb-0">
          <div className="pointer-events-auto max-w-lg">
            <Eyebrow>{HERO.eyebrow}</Eyebrow>
            <h1 id="hero-title" className="mt-4 text-balance font-black leading-[0.95] tracking-tight text-white [font-size:clamp(2.1rem,1rem+4vw,4.5rem)]">
              {HERO.h1}
            </h1>
            <p className="mt-4 max-w-md text-pretty text-sm text-zinc-300 sm:text-lg">{HERO.sub}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Btn href={HERO.primary.href}>{HERO.primary.label}</Btn>
              <Btn href={HERO.secondary.href} variant="ghost">{HERO.secondary.label}</Btn>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <LiveStrip />
              <Link href={HERO.tertiary.href} className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 hover:text-white">
                {HERO.tertiary.label} →
              </Link>
            </div>
          </div>
        </div>

        {/* Instruments: only when there's a tunnel to instrument */}
        {can3D && (
          <div className="absolute right-4 top-20 flex w-56 flex-col items-stretch gap-2 sm:right-6 lg:bottom-6 lg:right-8 lg:top-auto">
            <AeroSwitch
              mode={mode}
              onChange={(m) => {
                setModeTouched(true);
                setMode(m);
              }}
            />
            <div className="hidden sm:block"><Readout mode={mode} /></div>
            <p className="hidden text-right text-[10px] uppercase tracking-[0.35em] text-zinc-500 sm:block">
              {touched ? "Tap a number" : "Drag to turn the car"}
            </p>
          </div>
        )}

        {/* Opened pillar */}
        <AnimatePresence>
          {open && (
            <motion.div
              key={open.id}
              role="dialog"
              aria-modal="false"
              aria-labelledby={`plate-${open.id}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 bottom-0 z-30 mx-auto w-full max-w-6xl px-4 pb-6 sm:px-6 lg:inset-y-0 lg:flex lg:items-center lg:justify-end lg:px-8 lg:pb-0"
            >
              <Plate className="w-full lg:mr-64 lg:max-w-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Eyebrow>{open.eyebrow}</Eyebrow>
                    <h2 id={`plate-${open.id}`} className="mt-2 text-2xl font-black tracking-tight text-white">{open.title}</h2>
                  </div>
                  <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="-m-2 p-2 text-zinc-500 hover:text-white">
                    ✕
                  </button>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{open.body}</p>
                <div className="mt-4 border-t border-zinc-800 pt-4"><Fragment id={open.id} /></div>
                <Link href={open.href} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-400 hover:text-red-300">
                  {open.cta} →
                </Link>
              </Plate>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
