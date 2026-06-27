'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import type { ThrottleBrakeComparisonData, AdvancedPlotSettings } from '@/types/plot-types'

interface Props {
  data: ThrottleBrakeComparisonData
  height?: number
  advancedSettings?: AdvancedPlotSettings
}

export function ThrottleBrakeComparisonGraph({ data, advancedSettings }: Props) {
  const settings: AdvancedPlotSettings = advancedSettings ?? {
    showGrid: true,
    showLegend: true,
    animateChart: true,
    chartHeight: 700,
    lineThickness: 2,
    showDataLabels: false,
  }

  const totalHeight = settings.chartHeight ?? 700
  const textScale = settings.textScale ?? 1
  const fontSize = Math.round(12 * textScale)

  if (!data?.telemetry?.length) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No throttle &amp; brake comparison data available
      </div>
    )
  }

  const sortedTelemetry = [...data.telemetry].sort((a, b) => a.distance - b.distance)
  const d1Data = sortedTelemetry.filter(p => p.driver === data.driver1)
  const d2Data = sortedTelemetry.filter(p => p.driver === data.driver2)

  const allDistances = Array.from(
    new Set([
      ...d1Data.map(p => Math.round(p.distance * 10) / 10),
      ...d2Data.map(p => Math.round(p.distance * 10) / 10),
    ])
  ).sort((a, b) => a - b)

  const interpolate = (
    arr: { distance: number; throttle: number; brake: number }[],
    dist: number,
    key: 'throttle' | 'brake'
  ): number | null => {
    if (!arr.length) return null
    // Never extrapolate outside the driver's actual data range
    if (dist < arr[0].distance - 1 || dist > arr[arr.length - 1].distance + 1) return null
    const pt = arr.find(p => Math.abs(Math.round(p.distance * 10) / 10 - dist) < 0.1)
    if (pt) return pt[key]
    const before = arr.filter(p => p.distance < dist).pop()
    const after = arr.find(p => p.distance > dist)
    if (before && after) {
      const ratio = (dist - before.distance) / (after.distance - before.distance)
      return before[key] + ratio * (after[key] - before[key])
    }
    return null
  }

  const raw = allDistances.map(distance => ({
    distance,
    [`${data.driver1}_throttle`]: interpolate(d1Data, distance, 'throttle'),
    [`${data.driver1}_brake`]: interpolate(d1Data, distance, 'brake'),
    [`${data.driver2}_throttle`]: interpolate(d2Data, distance, 'throttle'),
    [`${data.driver2}_brake`]: interpolate(d2Data, distance, 'brake'),
  }))

  // Trim leading and trailing entries where both drivers have no data,
  // so the x-axis domain is bounded by actual telemetry.
  let firstValid = 0
  for (let i = 0; i < raw.length; i++) {
    if (raw[i][`${data.driver1}_throttle`] != null || raw[i][`${data.driver2}_throttle`] != null) {
      firstValid = i
      break
    }
  }
  let lastValid = raw.length - 1
  for (let i = raw.length - 1; i >= 0; i--) {
    if (raw[i][`${data.driver1}_throttle`] != null || raw[i][`${data.driver2}_throttle`] != null) {
      lastValid = i
      break
    }
  }
  const chartData = raw.slice(firstValid, lastValid + 1)
  const axisDomain: [number, number] = [
    chartData[0]?.distance ?? 0,
    chartData[chartData.length - 1]?.distance ?? 0,
  ]

  // Fit both charts + chrome within totalHeight
  // Chrome: legend row ~44px + two section headers ~60px + spacing ~20px = 124px
  const CHROME = 124
  const subHeight = Math.max(Math.floor((totalHeight - CHROME) / 2), 150)

  const gridColor = '#374151'
  const axisColor = '#6B7280'
  const axisStyle = { fontSize, fill: axisColor }
  // left margin must accommodate the rotated Y-axis label at any textScale
  const leftMargin = Math.round(40 + 20 * textScale)
  const rightMargin = Math.round(40 + 20 * textScale)
  const margin = { top: 8, right: rightMargin, left: leftMargin, bottom: 6 }

  return (
    <div style={{ height: `${totalHeight}px`, display: 'flex', flexDirection: 'column' }}>
      {/* Legend row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '8px', padding: '0 4px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: data.driver1_color }} />
          <span style={{ fontSize, color: '#e4e4e7', fontWeight: 500 }}>{data.driver1}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: data.driver2_color }} />
          <span style={{ fontSize, color: '#e4e4e7', fontWeight: 500 }}>{data.driver2}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px', fontSize: Math.round(10 * textScale), color: axisColor }}>
          <span>—&nbsp;Throttle</span>
          <span>- - &nbsp;Brake</span>
        </div>
      </div>

      {/* Throttle chart */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }} />
          <span style={{ fontSize, color: '#e4e4e7', fontWeight: 500 }}>Throttle Application</span>
          <span style={{ fontSize: Math.round(10 * textScale), color: axisColor, backgroundColor: 'rgba(34,197,94,0.1)', padding: '1px 6px', borderRadius: 3 }}>0-100%</span>
        </div>
        <div style={{ height: `${subHeight}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={margin}>
              {settings.showGrid && <CartesianGrid strokeDasharray="2 2" stroke={gridColor} opacity={0.3} />}
              <XAxis
                type="number"
                dataKey="distance"
                domain={axisDomain}
                tickCount={10}
                stroke={axisColor}
                tick={axisStyle}
                tickFormatter={v => `${Math.round(v / 100) * 100}m`}
                axisLine={{ stroke: axisColor, strokeWidth: 1 }}
              />
              <YAxis
                stroke={axisColor}
                domain={[0, 100]}
                tick={axisStyle}
                tickFormatter={v => `${v}%`}
                axisLine={{ stroke: axisColor, strokeWidth: 1 }}
                label={{ value: 'Throttle %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: axisColor, fontSize } }}
              />
              <Line type="monotone" dataKey={`${data.driver1}_throttle`} stroke={data.driver1_color} strokeWidth={settings.lineThickness} dot={false} connectNulls name={data.driver1} isAnimationActive={settings.animateChart} />
              <Line type="monotone" dataKey={`${data.driver2}_throttle`} stroke={data.driver2_color} strokeWidth={settings.lineThickness} dot={false} connectNulls name={data.driver2} isAnimationActive={settings.animateChart} />
              {settings.showLegend && <Legend wrapperStyle={{ fontSize: `${Math.round(11 * textScale)}px` }} iconType="line" />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Brake chart */}
      <div style={{ flexShrink: 0, marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }} />
          <span style={{ fontSize, color: '#e4e4e7', fontWeight: 500 }}>Brake Application</span>
          <span style={{ fontSize: Math.round(10 * textScale), color: axisColor, backgroundColor: 'rgba(239,68,68,0.1)', padding: '1px 6px', borderRadius: 3 }}>ON / OFF</span>
        </div>
        <div style={{ height: `${subHeight}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ ...margin, bottom: 24 }}>
              {settings.showGrid && <CartesianGrid strokeDasharray="2 2" stroke={gridColor} opacity={0.3} />}
              <XAxis
                type="number"
                dataKey="distance"
                domain={axisDomain}
                tickCount={10}
                stroke={axisColor}
                tick={axisStyle}
                tickFormatter={v => `${Math.round(v / 100) * 100}m`}
                axisLine={{ stroke: axisColor, strokeWidth: 1 }}
                label={{ value: 'Track Distance (m)', position: 'insideBottom', offset: -8, style: { textAnchor: 'middle', fill: axisColor, fontSize } }}
              />
              <YAxis
                stroke={axisColor}
                domain={[0, 1]}
                ticks={[0, 1]}
                tick={axisStyle}
                tickFormatter={v => (v === 1 ? 'ON' : 'OFF')}
                axisLine={{ stroke: axisColor, strokeWidth: 1 }}
                label={{ value: 'Brake Status', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: axisColor, fontSize } }}
              />
              <Line type="stepAfter" dataKey={`${data.driver1}_brake`} stroke={data.driver1_color} strokeWidth={settings.lineThickness} strokeDasharray="10,5" dot={false} connectNulls name={data.driver1} isAnimationActive={settings.animateChart} />
              <Line type="stepAfter" dataKey={`${data.driver2}_brake`} stroke={data.driver2_color} strokeWidth={settings.lineThickness} strokeDasharray="10,5" dot={false} connectNulls name={data.driver2} isAnimationActive={settings.animateChart} />
              {settings.showLegend && <Legend wrapperStyle={{ fontSize: `${Math.round(11 * textScale)}px` }} iconType="line" />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
