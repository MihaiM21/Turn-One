"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

/**
 * three.js never renders on the server. The poster is what SSR (and crawlers,
 * and reduced-motion users) get; the scene streams in behind it.
 */
export const CarSceneLazy = dynamic(() => import("./car-scene").then((m) => m.CarScene), {
  ssr: false,
  loading: () => null,
});

type Nav = Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };

/**
 * Whether to mount the 3D scene at all, decided after the browser goes idle so
 * the three.js chunk never competes with the poster (LCP) or first input (INP).
 * Skipped for reduced motion, Save-Data, low-memory devices and no WebGL — they
 * keep the poster, which carries the same page.
 */
export function useCanRender3D() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const nav = navigator as Nav;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (nav.connection?.saveData) return;
    if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return;
    if (!hasWebGL()) return;
    const go = () => setOk(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(go, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(go, 300);
    return () => clearTimeout(id);
  }, []);
  return ok;
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
