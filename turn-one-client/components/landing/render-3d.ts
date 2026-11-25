"use client"

import { useEffect, useState } from "react"

type Nav = Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number }

/**
 * Whether the hero may run its 3D scene: "pending" until the browser goes idle (so the three.js
 * chunk never competes with first paint or first input), then "yes" or "no". "No" for reduced
 * motion, Save-Data, low-memory devices and no WebGL; they get the 2D dotted circuit instead.
 */
export function useRender3D(): "pending" | "yes" | "no" {
  const [state, setState] = useState<"pending" | "yes" | "no">("pending")
  useEffect(() => {
    const nav = navigator as Nav
    const no =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !!nav.connection?.saveData ||
      (nav.deviceMemory !== undefined && nav.deviceMemory < 4) ||
      !hasWebGL()
    const decide = () => setState(no ? "no" : "yes")
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(decide, { timeout: 1500 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(decide, 300)
    return () => clearTimeout(id)
  }, [])
  return state
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas")
    return !!(c.getContext("webgl2") || c.getContext("webgl"))
  } catch {
    return false
  }
}
