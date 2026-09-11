'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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
  const m = Math.floor(secs / 60)
  const s = (secs % 60).toFixed(3)
  return `${m}:${s.padStart(6, '0')}`
}

interface LapDistributionGraphProps {
  data: LapTimeDistributionPoint[]
  advancedSettings?: AdvancedPlotSettings
}

export function LapDistributionGraph({ data, advancedSettings }: LapDistributionGraphProps) {
  const settings = advancedSettings ?? {
    showGrid: true,
    showLegend: true,
    animateChart: true,
    chartHeight: 700,
    lineThickness: 2,
    showDataLabels: false,
  }

  const driverMeta = useMemo(() => {
    const m = new Map<string, string>()
    let idx = 0
    for (const p of data) {
      if (!m.has(p.driver)) {
        m.set(p.driver, p.color ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length])
        idx++
      }
    }
    return m
  }, [data])

  const driverTeam = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of data) {
      if (!m.has(p.driver)) m.set(p.driver, p.team ?? p.driver)
    }
    return m
  }, [data])

  const drivers = useMemo(() => Array.from(driverMeta.keys()), [driverMeta])

  const filteredData = useMemo(() => {
    if (!data.length) return []
    const byDriver = new Map<string, number[]>()
    for (const p of data) {
      const arr = byDriver.get(p.driver) ?? []
      arr.push(p.lapTime)
      byDriver.set(p.driver, arr)
    }
    const medians = new Map<string, number>()
    byDriver.forEach((times, driver) => {
      const sorted = [...times].sort((a, b) => a - b)
      medians.set(driver, sorted[Math.floor(sorted.length / 2)])
    })
    return data.filter((p) => {
      const median = medians.get(p.driver) ?? Infinity
      return p.lapTime <= median * 1.5
    })
  }, [data])

  const chartData = useMemo(() => {
    const byLap = new Map<number, Record<string, number>>()
    for (const p of filteredData) {
      if (!byLap.has(p.lap)) byLap.set(p.lap, { lap: p.lap })
      byLap.get(p.lap)![p.driver] = p.lapTime
    }
    return Array.from(byLap.values()).sort((a, b) => a.lap - b.lap)
  }, [filteredData])

  if (!data.length || !chartData.length) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No lap distribution data available
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs">
        <p className="mb-1 font-mono text-zinc-400">Lap {label}</p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} style={{ color: entry.color }} className="font-mono">
            {entry.dataKey}: {formatLapTime(entry.value)}
          </p>
        ))}
      </div>
    )
  }

  const s = settings.textScale ?? 1
  const tickFontSize = Math.round(11 * s)
  const yAxisWidth   = Math.round(58  * s)

  return (
    <div style={{ height: `${settings.chartHeight}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 24, bottom: 20, left: 10 }}>
          {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
          <XAxis
            dataKey="lap"
            stroke="#9CA3AF"
            tick={{ fontFamily: 'monospace', fontSize: tickFontSize }}
            label={{ value: 'Lap', position: 'insideBottom', offset: -10, fill: '#52525b', fontSize: Math.round(10 * s) }}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fontFamily: 'monospace', fontSize: tickFontSize }}
            tickFormatter={formatLapTime}
            domain={['auto', 'auto']}
            width={yAxisWidth}
          />
          <Tooltip content={<CustomTooltip />} />
          {settings.showLegend && (
            <Legend wrapperStyle={{ fontSize: tickFontSize, fontFamily: 'monospace' }} />
          )}
          {(() => {
            const teamSeen = new Set<string>()
            return drivers.map((d) => {
              const team = driverTeam.get(d) ?? d
              const isSecondTeammate = teamSeen.has(team)
              teamSeen.add(team)
              return (
                <Line
                  key={d}
                  type="monotone"
                  dataKey={d}
                  stroke={driverMeta.get(d)}
                  strokeWidth={settings.lineThickness}
                  strokeDasharray={isSecondTeammate ? '6 3' : undefined}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls={true}
                  isAnimationActive={settings.animateChart}
                />
              )
            })
          })()}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
