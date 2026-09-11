'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TrackMapData } from '@/types/plot-types-v2';
import { AdvancedPlotSettings } from '@/types/plot-types';
import { speedToColor, gearToColor } from '@/lib/color-scale';

interface TrackMapGraphProps {
  data: TrackMapData;
  height?: number;
  width?: number;
  advancedSettings?: AdvancedPlotSettings;
}

// Corner metadata shape isn't reliably populated by the live API (often an
// empty array) — read defensively rather than assuming specific fields.
function readCornerPoint(corner: unknown): { x: number; y: number; name?: string } | null {
  if (!corner || typeof corner !== 'object') return null
  const c = corner as Record<string, unknown>
  const x = typeof c.x === 'number' ? c.x : undefined
  const y = typeof c.y === 'number' ? c.y : undefined
  if (x === undefined || y === undefined) return null
  const name = typeof c.corner_name === 'string' ? c.corner_name : typeof c.name === 'string' ? c.name : undefined
  return { x, y, name }
}

export function TrackMapGraph({ data, height = 700, width = 700, advancedSettings }: TrackMapGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(width)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width
      if (w && w > 0) setContainerWidth(w)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const settings = advancedSettings || {
    showGrid: true,
    showLegend: true,
    animateChart: true,
    chartHeight: 700,
    lineThickness: 2,
    showDataLabels: false,
  }

  height = settings.chartHeight

  if (!data || !data.points || data.points.length === 0) {
    return (
      <div className="flex items-center justify-center h-[700px] text-muted-foreground">
        No track map data available
      </div>
    );
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const point of data.points) {
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }

  const trackWidth = maxX - minX;
  const trackHeight = maxY - minY;

  if (trackWidth <= 0 || trackHeight <= 0) {
    return (
      <div className="flex items-center justify-center h-[700px] text-muted-foreground">
        Invalid track data - no dimensions available
      </div>
    );
  }

  const CHROME_HEIGHT = 100
  const svgWidth = containerWidth
  const svgHeight = Math.max(height - CHROME_HEIGHT, 200)

  const dynamicPadding = Math.min(Math.max(svgWidth * 0.03, 20), svgWidth * 0.08);
  const availableWidth = svgWidth - (dynamicPadding * 2);
  const availableHeight = svgHeight - (dynamicPadding * 2);

  const scaleX = availableWidth / trackWidth;
  const scaleY = availableHeight / trackHeight;
  const scale = Math.min(scaleX, scaleY);

  const scaledTrackWidth = trackWidth * scale;
  const scaledTrackHeight = trackHeight * scale;

  const offsetX = (svgWidth - scaledTrackWidth) / 2;
  const offsetY = (svgHeight - scaledTrackHeight) / 2;

  const baseStrokeWidth = Math.max(2, Math.min(8, scale * 0.01));
  const strokeWidth = baseStrokeWidth * settings.lineThickness;

  const project = (x: number, y: number) => ({
    px: (x - minX) * scale + offsetX,
    py: (y - minY) * scale + offsetY,
  })

  const speeds = data.points.map((p) => p.speed)
  const minSpeed = Math.min(...speeds)
  const maxSpeed = Math.max(...speeds)

  const segments = [];
  for (let i = 0; i < data.points.length - 1; i++) {
    const current = data.points[i];
    const next = data.points[i + 1];
    const { px: x1, py: y1 } = project(current.x, current.y);
    const { px: x2, py: y2 } = project(next.x, next.y);

    const color = data.color_by === 'gear'
      ? gearToColor(current.gear)
      : speedToColor(current.speed, minSpeed, maxSpeed);

    segments.push(
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    );
  }

  const cornerMarkers = (data.circuit?.corners ?? [])
    .map(readCornerPoint)
    .filter((c): c is { x: number; y: number; name?: string } => c !== null)
    .map((corner, i) => {
      const { px, py } = project(corner.x, corner.y)
      return (
        <g key={`corner-${i}`}>
          <circle cx={px} cy={py} r={4} fill="#F9FAFB" stroke="#18181b" strokeWidth={1} />
          {corner.name && <text x={px + 6} y={py - 6} fontSize={11} fill="#d4d4d8">{corner.name}</text>}
        </g>
      )
    })

  const brakingZones = (data.braking_segments ?? []).map((zone, i) => {
    const startPoint = data.points[zone.start_idx]
    const endPoint = data.points[zone.end_idx]
    if (!startPoint || !endPoint) return null
    const start = project(startPoint.x, startPoint.y)
    const end = project(endPoint.x, endPoint.y)
    return (
      <line
        key={`brake-${i}`}
        x1={start.px}
        y1={start.py}
        x2={end.px}
        y2={end.py}
        stroke="#ef4444"
        strokeWidth={strokeWidth + 3}
        strokeLinecap="round"
        opacity={0.5}
      />
    )
  })

  return (
    <div ref={containerRef} className="w-full flex flex-col">
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold text-foreground">
          {data.driver} — {data.lap_time_s.toFixed(3)}s
        </h3>
        <p className="text-xs text-muted-foreground">
          {data.session_info?.event_name} — {data.session_info?.session_name}
        </p>
      </div>

      <div style={{ height: `${svgHeight}px` }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="border border-border rounded-lg bg-card"
        >
          <rect width={svgWidth} height={svgHeight} fill="transparent" />
          <g>{brakingZones}</g>
          <g>{segments}</g>
          <g>{cornerMarkers}</g>
        </svg>
      </div>

      {settings.showLegend && (
        <div className="flex flex-col items-center gap-2 mt-4">
          {data.color_by === 'speed' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">{minSpeed.toFixed(0)} km/h</span>
              <div className="h-3 w-40 rounded" style={{ background: 'linear-gradient(to right, rgb(59,130,246), rgb(234,179,8), rgb(239,68,68))' }} />
              <span className="text-xs text-zinc-400">{maxSpeed.toFixed(0)} km/h</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((gear) => (
                <span key={gear} className="flex items-center gap-1 text-xs text-zinc-400">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: gearToColor(gear) }} />
                  {gear}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Red overlay = braking zone</p>
        </div>
      )}
    </div>
  );
}
