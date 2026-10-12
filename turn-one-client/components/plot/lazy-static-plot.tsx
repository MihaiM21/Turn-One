"use client"

import dynamic from "next/dynamic"
import type { ComponentProps } from "react"

type StaticPlotProps = ComponentProps<typeof import("./static-plot").StaticPlot>

// The plot catalog pulls every chart component (Recharts and all) into whatever
// imports it. On the SEO pages the data is already in server-rendered tables,
// so the charts are progressive enhancement: load them after first paint, in a
// box of the same height so nothing jumps when they arrive.
const StaticPlot = dynamic(() => import("./static-plot").then((m) => m.StaticPlot), {
  ssr: false,
  loading: () => <div className="h-[500px] animate-pulse bg-zinc-900/60" aria-hidden />,
})

export function LazyStaticPlot(props: StaticPlotProps) {
  return <StaticPlot {...props} />
}
