"use client"

import { forwardRef, type ReactNode } from "react"

interface OffscreenRendererProps {
  width: number
  height: number
  children: ReactNode
  /** Skips the opaque wrapper background — needed for the 4K transparent creator export. */
  transparent?: boolean
}

/**
 * Off-screen container sized exactly to the export dimensions.
 * Positioned far left to avoid layout/scroll impact while still being part of the DOM
 * so Recharts ResponsiveContainer measures its real width/height.
 */
export const OffscreenRenderer = forwardRef<HTMLDivElement, OffscreenRendererProps>(
  function OffscreenRenderer({ width, height, children, transparent = false }, ref) {
    const background = transparent ? undefined : "#09090b"
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: -100000,
          width,
          height,
          background,
          pointerEvents: "none",
          zIndex: -1,
        }}
        aria-hidden="true"
      >
        <div ref={ref} style={{ width, height, background }}>
          {children}
        </div>
      </div>
    )
  }
)
