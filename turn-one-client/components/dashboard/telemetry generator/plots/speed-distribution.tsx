'use client'

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { AdvancedPlotSettings, SpeedDistributionPoint } from '@/types/plot-types'

interface SpeedDistributionGraphProps {
  data: SpeedDistributionPoint[]
  selectedDrivers: string[]
  advancedSettings?: AdvancedPlotSettings
  /** Ignore team colors and assign each driver a distinct, easily distinguishable color instead. */
  useDistinctColors?: boolean
}

// Colorblind-friendly categorical palette (Okabe-Ito), chosen for max contrast between adjacent entries.
const DISTINCT_COLOR_PALETTE = ['#0072B2', '#E69F00', '#009E73', '#D55E00', '#CC79A7', '#F0E442', '#56B4E9']

interface DriverSpeedPoint {
  time: number
  speed: number
}

function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!match) return null
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)]
}

function colorsLookAlike(a: string, b: string): boolean {
  if (a.toLowerCase() === b.toLowerCase()) return true

  const rgbA = hexToRgb(a)
  const rgbB = hexToRgb(b)
  if (!rgbA || !rgbB) return false

  const distance = Math.sqrt(
    (rgbA[0] - rgbB[0]) ** 2 + (rgbA[1] - rgbB[1]) ** 2 + (rgbA[2] - rgbB[2]) ** 2
  )

  // Teammates are often given slightly different shades of the same team
  // color (e.g. one lighter/darker red) rather than a byte-identical hex.
  return distance < 60
}

function findNearestSpeed(points: DriverSpeedPoint[], targetTime: number): number | null {
  if (points.length === 0) return null

  let low = 0
  let high = points.length - 1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const midTime = points[mid].time

    if (midTime === targetTime) {
      return points[mid].speed
    }

    if (midTime < targetTime) {
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  const rightIndex = Math.min(low, points.length - 1)
  const leftIndex = Math.max(high, 0)
  const rightPoint = points[rightIndex]
  const leftPoint = points[leftIndex]

  return Math.abs(rightPoint.time - targetTime) < Math.abs(leftPoint.time - targetTime)
    ? rightPoint.speed
    : leftPoint.speed
}

export function SpeedDistributionGraph({ data, selectedDrivers, advancedSettings, useDistinctColors }: SpeedDistributionGraphProps) {
  const settings = advancedSettings || {
    showGrid: true,
    showLegend: true,
    animateChart: true,
    chartHeight: 700,
    lineThickness: 2,
    showDataLabels: false
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No speed distribution data available
      </div>
    )
  }

  const allowedDrivers = selectedDrivers.filter(driver => !!driver)
  const colorByDriver = new Map<string, string>()
  const byTime = new Map<number, Record<string, number>>()
  const pointsByDriver = new Map<string, DriverSpeedPoint[]>()

  for (const point of data) {
    if (!allowedDrivers.includes(point.driver)) continue

    if (!colorByDriver.has(point.driver)) {
      const paletteColor = DISTINCT_COLOR_PALETTE[colorByDriver.size % DISTINCT_COLOR_PALETTE.length]
      colorByDriver.set(point.driver, useDistinctColors ? paletteColor : point.color || '#F9FAFB')
    }

    const roundedTime = Number(point.time.toFixed(3))
    if (!byTime.has(roundedTime)) {
      byTime.set(roundedTime, { time: roundedTime })
    }

    byTime.get(roundedTime)![point.driver] = point.speed

    if (!pointsByDriver.has(point.driver)) {
      pointsByDriver.set(point.driver, [])
    }
    pointsByDriver.get(point.driver)!.push({ time: roundedTime, speed: point.speed })
  }

  const chartData = Array.from(byTime.values()).sort((a, b) => Number(a.time) - Number(b.time))
  const driversInData = allowedDrivers.filter(driver => colorByDriver.has(driver))

  const dashByDriver = new Map<string, string | undefined>()
  const seenColors: string[] = []
  for (const driver of driversInData) {
    const baseColor = colorByDriver.get(driver) || '#F9FAFB'
    const matchesEarlierDriver = seenColors.some(seenColor => colorsLookAlike(seenColor, baseColor))
    dashByDriver.set(driver, matchesEarlierDriver ? '12 8' : undefined)
    seenColors.push(baseColor)
  }

  // Dashed teammate lines must be drawn last so their dash gaps actually
  // punch through the same-colored solid line instead of being covered by it.
  const orderedDrivers = [...driversInData].sort((a, b) => {
    const aDashed = dashByDriver.get(a) ? 1 : 0
    const bDashed = dashByDriver.get(b) ? 1 : 0
    return aDashed - bDashed
  })

  for (const driver of driversInData) {
    const points = pointsByDriver.get(driver) || []
    points.sort((a, b) => a.time - b.time)
  }

  if (chartData.length === 0 || driversInData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No speed trace available for selected driver(s)
      </div>
    )
  }

  return (
    <div style={{ height: `${settings.chartHeight}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
          {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
          <XAxis
            dataKey="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            stroke="#9CA3AF"
            tick={{ fontSize: Math.round(11 * (settings.textScale ?? 1)) }}
            tickFormatter={(value) => `${Number(value).toFixed(1)}s`}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fontSize: Math.round(11 * (settings.textScale ?? 1)) }}
            tickFormatter={(value) => `${Number(value).toFixed(0)}`}
            label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft', fill: '#9CA3AF', style: { fontSize: Math.round(11 * (settings.textScale ?? 1)) } }}
          />
          <Tooltip
            content={({ active, label }) => {
              if (!active || label === undefined || label === null) {
                return null
              }

              const hoverTime = Number(label)

              return (
                <div
                  style={{
                    backgroundColor: 'var(--popover)',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '10px 12px'
                  }}
                >
                  <div style={{ color: '#F9FAFB', marginBottom: '6px' }}>
                    Time: {hoverTime.toFixed(3)} s
                  </div>

                  {driversInData.map((driver) => {
                    const nearestSpeed = findNearestSpeed(pointsByDriver.get(driver) || [], hoverTime)
                    return (
                      <div key={driver} style={{ color: colorByDriver.get(driver) || '#F9FAFB' }}>
                        {driver}: {nearestSpeed !== null ? `${nearestSpeed.toFixed(1)} km/h` : '-'}
                      </div>
                    )
                  })}
                </div>
              )
            }}
          />
          {settings.showLegend && <Legend />}

          {orderedDrivers.map((driver) => {
            const dash = dashByDriver.get(driver)
            const color = colorByDriver.get(driver) || '#F9FAFB'

            return (
              <Line
                key={driver}
                type="monotone"
                dataKey={driver}
                name={driver}
                stroke={color}
                strokeWidth={dash ? settings.lineThickness + 1 : settings.lineThickness}
                strokeDasharray={dash}
                dot={false}
                connectNulls
                isAnimationActive={settings.animateChart}
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
