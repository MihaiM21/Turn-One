"use client"

import { forwardRef, type ReactNode } from "react"

interface OffscreenRendererProps {
  width: number
  height: number
  children: ReactNode
}

/**
 * Off-screen container sized exactly to the export dimensions.
 * Positioned far left to avoid layout/scroll impact while still being part of the DOM
 * so Recharts ResponsiveContainer measures its real width/height.
 */
export const OffscreenRenderer = forwardRef<HTMLDivElement, OffscreenRendererProps>(
  function OffscreenRenderer({ width, height, children }, ref) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: -100000,
          width,
          height,
          background: "#09090b",
          pointerEvents: "none",
          zIndex: -1,
        }}
        aria-hidden="true"
      >
        <div ref={ref} style={{ width, height, background: "#09090b" }}>
          {children}
        </div>
      </div>
    )
  }
)
