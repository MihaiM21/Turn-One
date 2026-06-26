'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { LapTimeDistributionPoint } from '@/types/news-types'
import { AdvancedPlotSettings } from '@/types/plot-types'

const FALLBACK_COLORS = [
  '#e11d48', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  '#06b6d4', '#a855f7', '#ef4444', '#22d3ee', '#facc15',
  '#4ade80', '#fb923c', '#c084fc', '#34d399', '#f472b6',
  '#60a5fa', '#a3e635',
]

const formatLapTime = (secs: number): string => {
  if (!secs || secs <= 0) return ''
  const m = Math.floor(secs / 60)
  const s = (secs % 60).toFixed(3)
  return `${m}:${s.padStart(6, '0')}`
}

interface BoxEntry {
  driver: string
  color: string
  // anchor value for the bar — median keeps the hit area centred on the box
  medianVal: number
  q1Val: number
  q3Val: number
  minVal: number
  maxVal: number
}

// Shape receives `background` from Recharts which is the full plot-area rect.
// Everything else is computed from data values + the domain passed via closure.
function makeBoxShape(yDomain: [number, number]) {
  return function BoxShape(props: any) {
    const { x, width, background } = props
    const entry: BoxEntry = props

    if (!background || !width) return null

    const { y: chartTop, height: chartHeight } = background
    const chartBottom = chartTop + chartHeight
    const [dMin, dMax] = yDomain
    const range = dMax - dMin
    if (range <= 0) return null

    const toY = (v: number) => chartBottom - ((v - dMin) / range) * chartHeight

    const q1y  = toY(entry.q1Val)
    const q3y  = toY(entry.q3Val)
    const medy = toY(entry.medianVal)
    const miny = toY(entry.minVal)
    const maxy = toY(entry.maxVal)
    const cx   = x + width / 2
    const hw   = Math.max(8, width * 0.38)
    const capHw = hw * 0.45
    const { color } = entry

    return (
      <g>
        {/* IQR box */}
        <rect
          x={cx - hw} y={q3y} width={hw * 2} height={Math.max(1, q1y - q3y)}
          fill={color} fillOpacity={0.45} stroke={color} strokeWidth={1.5}
        />
        {/* Median line */}
        <line x1={cx - hw} x2={cx + hw} y1={medy} y2={medy} stroke={color} strokeWidth={2.5} />
        {/* Upper whisker */}
        <line x1={cx} x2={cx} y1={q3y} y2={maxy} stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
        <line x1={cx - capHw} x2={cx + capHw} y1={maxy} y2={maxy} stroke={color} strokeWidth={1.5} />
        {/* Lower whisker */}
        <line x1={cx} x2={cx} y1={q1y} y2={miny} stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
        <line x1={cx - capHw} x2={cx + capHw} y1={miny} y2={miny} stroke={color} strokeWidth={1.5} />
      </g>
    )
  }
}

interface LapTimeCandlestickGraphProps {
  data: LapTimeDistributionPoint[]
  advancedSettings?: AdvancedPlotSettings
}

export function LapTimeCandlestickGraph({ data, advancedSettings }: LapTimeCandlestickGraphProps) {
  const settings = advancedSettings ?? {
    showGrid: true, showLegend: true, animateChart: true,
    chartHeight: 700, lineThickness: 2, showDataLabels: false,
  }

  const chartData = useMemo((): BoxEntry[] => {
    if (!data.length) return []
    const byDriver = new Map<string, { times: number[]; color: string }>()
    let idx = 0
    for (const p of data) {
      if (!byDriver.has(p.driver)) {
        byDriver.set(p.driver, {
          times: [],
          color: p.color ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
        })
        idx++
      }
      byDriver.get(p.driver)!.times.push(p.lapTime)
    }

    return Array.from(byDriver.entries())
      .map(([driver, { times, color }]) => {
        const sorted = [...times].sort((a, b) => a - b)
        if (sorted.length < 3) return null

        const n = sorted.length
        const q1     = sorted[Math.floor(n * 0.25)]
        const median = sorted[Math.floor(n * 0.5)]
        const q3     = sorted[Math.floor(n * 0.75)]
        const iqr    = q3 - q1

        // Tukey whiskers — exclude extreme outliers (SC laps, DNF laps, etc.)
        const lowerFence = q1 - 1.5 * iqr
        const upperFence = q3 + 1.5 * iqr
        const whiskerLow  = sorted.find((t) => t >= lowerFence) ?? q1
        const whiskerHigh = [...sorted].reverse().find((t) => t <= upperFence) ?? q3

        return { driver, color, medianVal: median, q1Val: q1, q3Val: q3, minVal: whiskerLow, maxVal: whiskerHigh } satisfies BoxEntry
      })
      .filter(Boolean) as BoxEntry[]
  }, [data])

  const yDomain = useMemo((): [number, number] => {
    if (!chartData.length) return [0, 1]
    const mins = chartData.map((d) => d.minVal)
    const maxs = chartData.map((d) => d.maxVal)
    const lo = Math.min(...mins)
    const hi = Math.max(...maxs)
    const pad = (hi - lo) * 0.12
    return [lo - pad, hi + pad]
  }, [chartData])

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No lap distribution data available
      </div>
    )
  }

  const BoxShape = makeBoxShape(yDomain)

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d: BoxEntry = payload[0]?.payload
    if (!d) return null
    return (
      <div className="border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono space-y-0.5">
        <p className="font-bold mb-1" style={{ color: d.color }}>{d.driver}</p>
        <p className="text-zinc-400">Max:    {formatLapTime(d.maxVal)}</p>
        <p className="text-zinc-400">Q3:     {formatLapTime(d.q3Val)}</p>
        <p className="text-zinc-300">Median: {formatLapTime(d.medianVal)}</p>
        <p className="text-zinc-400">Q1:     {formatLapTime(d.q1Val)}</p>
        <p className="text-zinc-400">Min:    {formatLapTime(d.minVal)}</p>
      </div>
    )
  }

  return (
    <div style={{ height: `${settings.chartHeight}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 16 }}>
          {settings.showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          )}
          <XAxis dataKey="driver" stroke="#52525b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
          <YAxis
            stroke="#52525b"
            tickFormatter={formatLapTime}
            domain={yDomain}
            allowDataOverflow
            width={62}
            tick={{ fontFamily: 'monospace', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar
            dataKey="medianVal"
            shape={<BoxShape />}
            isAnimationActive={false}
            legendType="none"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
