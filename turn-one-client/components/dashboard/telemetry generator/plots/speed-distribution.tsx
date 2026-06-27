'use client'

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { AdvancedPlotSettings, SpeedDistributionPoint } from '@/types/plot-types'

interface SpeedDistributionGraphProps {
  data: SpeedDistributionPoint[]
  selectedDrivers: string[]
  advancedSettings?: AdvancedPlotSettings
}

interface DriverSpeedPoint {
  time: number
  speed: number
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

export function SpeedDistributionGraph({ data, selectedDrivers, advancedSettings }: SpeedDistributionGraphProps) {
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
      colorByDriver.set(point.driver, point.color || '#F9FAFB')
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

          {driversInData.map((driver) => (
            <Line
              key={driver}
              type="monotone"
              dataKey={driver}
              name={driver}
              stroke={colorByDriver.get(driver) || '#F9FAFB'}
              strokeWidth={settings.lineThickness}
              dot={false}
              connectNulls
              isAnimationActive={settings.animateChart}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
