'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ThrottleBrakeComparisonData } from '@/types/plot-types'

interface ThrottleBrakeComparisonGraphProps {
  data: ThrottleBrakeComparisonData
  height?: number
}

export function ThrottleBrakeComparisonGraph({ data, height = 700 }: ThrottleBrakeComparisonGraphProps) {
  if (!data || !data.telemetry || data.telemetry.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No throttle & brake comparison data available
      </div>
    )
  }

  // Sort and prepare data for continuous lines
  const sortedTelemetry = [...data.telemetry].sort((a, b) => a.distance - b.distance)
  
  // Create separate arrays for each driver to ensure continuity
  const driver1Data = sortedTelemetry.filter(p => p.driver === data.driver1)
  const driver2Data = sortedTelemetry.filter(p => p.driver === data.driver2)
  
  // Create a unified distance array with all unique distances
  const allDistances = Array.from(new Set([
    ...driver1Data.map(p => Math.round(p.distance * 10) / 10), // Round to 1 decimal
    ...driver2Data.map(p => Math.round(p.distance * 10) / 10)
  ])).sort((a, b) => a - b)
  
  // Interpolate data for missing points to ensure continuous lines
  const interpolateValue = (data: any[], distance: number, valueKey: 'throttle' | 'brake') => {
    const point = data.find(p => Math.abs(Math.round(p.distance * 10) / 10 - distance) < 0.1)
    if (point) return point[valueKey]
    
    // Find surrounding points for interpolation
    const before = data.filter(p => p.distance < distance).pop()
    const after = data.find(p => p.distance > distance)
    
    if (before && after) {
      const ratio = (distance - before.distance) / (after.distance - before.distance)
      return before[valueKey] + ratio * (after[valueKey] - before[valueKey])
    }
    
    return before ? before[valueKey] : (after ? after[valueKey] : null)
  }
  
  // Create chart data with interpolated values
  const sortedData = allDistances.map(distance => ({
    distance,
    [`${data.driver1}_throttle`]: interpolateValue(driver1Data, distance, 'throttle'),
    [`${data.driver1}_brake`]: interpolateValue(driver1Data, distance, 'brake'),
    [`${data.driver2}_throttle`]: interpolateValue(driver2Data, distance, 'throttle'),
    [`${data.driver2}_brake`]: interpolateValue(driver2Data, distance, 'brake'),
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-foreground font-medium mb-2">{`Distance: ${label}m`}</p>
          {payload.map((entry: any, index: number) => {
            const isThrottle = entry.dataKey.includes('throttle')
            const isBrake = entry.dataKey.includes('brake')
            const driver = entry.dataKey.split('_')[0]
            const value = entry.value
            
            let displayValue = ''
            if (isThrottle) {
              displayValue = `${value?.toFixed(1) || 0}%`
            } else if (isBrake) {
              displayValue = value === 1 ? 'ON' : 'OFF'
            }
            
            return (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {`${driver} ${isThrottle ? 'Throttle' : 'Brake'}: ${displayValue}`}
              </p>
            )
          })}
        </div>
      )
    }
    return null
  }

  const ThrottleTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-4 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <p className="text-foreground font-semibold text-sm">{`${Math.round(label)}m`}</p>
          </div>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => {
              const driver = entry.dataKey.split('_')[0]
              const value = entry.value
              
              return (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border border-white" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm font-medium">{driver}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {value?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
    return null
  }

  const BrakeTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-4 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <p className="text-foreground font-semibold text-sm">{`${Math.round(label)}m`}</p>
          </div>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => {
              const driver = entry.dataKey.split('_')[0]
              const value = entry.value
              
              return (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border border-white" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm font-medium">{driver}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`px-2 py-1 rounded text-xs font-bold ${
                      value === 1 
                        ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {value === 1 ? 'ON' : 'OFF'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      {/* Header with improved styling */}
      <div className="mb-4 space-y-3">
        {/* Driver Legend with enhanced visibility */}
        <div className="flex items-center gap-6 bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
              style={{ backgroundColor: data.driver1_color }}
            />
            <span className="text-sm font-medium text-foreground">{data.driver1}</span>
          </div>
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
              style={{ backgroundColor: data.driver2_color }}
            />
            <span className="text-sm font-medium text-foreground">{data.driver2}</span>
          </div>
          <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-current"></div>
              <span>Throttle</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-current" style={{ borderTop: '2px dashed currentColor', backgroundColor: 'transparent' }}></div>
              <span>Brake</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Throttle Chart with enhanced design */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <h3 className="text-base font-medium text-foreground">Throttle Application</h3>
          <div className="text-xs text-muted-foreground bg-green-50 dark:bg-green-950 px-2 py-1 rounded">
            0-100%
          </div>
        </div>
        <div className="bg-background/50 p-3 rounded-lg border">
          <div className="h-70 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sortedData} margin={{ top: 20, right: 40, left: 40, bottom: 10 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="distance" 
                  stroke="#6B7280"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(value) => `${Math.round(value/100)*100}m`}
                  axisLine={{ stroke: '#6B7280', strokeWidth: 1 }}
                />
                <YAxis 
                  stroke="#6B7280"
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(value) => `${value}%`}
                  axisLine={{ stroke: '#6B7280', strokeWidth: 1 }}
                  label={{ value: 'Throttle %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: '12px' } }}
                />
                <Tooltip content={<ThrottleTooltip />} />
                
                <Line
                  type="monotone"
                  dataKey={`${data.driver1}_throttle`}
                  stroke={data.driver1_color}
                  strokeWidth={3}
                  dot={false}
                  connectNulls={true}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  name={`${data.driver1}`}
                />
                
                <Line
                  type="monotone"
                  dataKey={`${data.driver2}_throttle`}
                  stroke={data.driver2_color}
                  strokeWidth={3}
                  dot={false}
                  connectNulls={true}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  name={`${data.driver2}`}
                />
                
                <Legend 
                  wrapperStyle={{ paddingTop: '15px', fontSize: '13px' }}
                  iconType="line"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Brake Chart with enhanced design */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <h3 className="text-base font-medium text-foreground">Brake Application</h3>
          <div className="text-xs text-muted-foreground bg-red-50 dark:bg-red-950 px-2 py-1 rounded">
            ON / OFF
          </div>
        </div>
        <div className="bg-background/50 p-3 rounded-lg border">
          <div className="h-70 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sortedData} margin={{ top: 20, right: 40, left: 40, bottom: 10 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="distance" 
                  stroke="#6B7280"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(value) => `${Math.round(value/100)*100}m`}
                  axisLine={{ stroke: '#6B7280', strokeWidth: 1 }}
                  label={{ value: 'Track Distance (m)', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#6B7280', fontSize: '12px' } }}
                />
                <YAxis 
                  stroke="#6B7280"
                  domain={[0, 1]}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(value) => value === 1 ? 'ON' : 'OFF'}
                  axisLine={{ stroke: '#6B7280', strokeWidth: 1 }}
                  label={{ value: 'Brake Status', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: '12px' } }}
                />
                <Tooltip content={<BrakeTooltip />} />
                
                <Line
                  type="stepAfter"
                  dataKey={`${data.driver1}_brake`}
                  stroke={data.driver1_color}
                  strokeWidth={3}
                  strokeDasharray="10,5"
                  dot={false}
                  connectNulls={true}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  name={`${data.driver1}`}
                />
                
                <Line
                  type="stepAfter"
                  dataKey={`${data.driver2}_brake`}
                  stroke={data.driver2_color}
                  strokeWidth={3}
                  strokeDasharray="10,5"
                  dot={false}
                  connectNulls={true}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  name={`${data.driver2}`}
                />
                
                <Legend 
                  wrapperStyle={{ paddingTop: '15px', fontSize: '13px' }}
                  iconType="line"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}