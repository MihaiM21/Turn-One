'use client';

import React from 'react';
import { TrackComparisonData } from '@/types/plot-types';

interface TrackComparisonGraphProps {
  data: TrackComparisonData;
  height?: number;
  width?: number;
}

export function TrackComparisonGraph({ data, height = 700, width = 700 }: TrackComparisonGraphProps) {
  // Don't render if no data
  if (!data || !data.telemetry || data.telemetry.length === 0) {
    return (
      <div className="flex items-center justify-center h-[700px] text-muted-foreground">
        No track comparison data available
      </div>
    );
  }

  // Calculate bounds for the track to fit in the viewBox
  const xCoords = data.telemetry.map(point => point.x);
  const yCoords = data.telemetry.map(point => point.y);
  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yCoords);
  
  // Calculate track dimensions
  const trackWidth = maxX - minX;
  const trackHeight = maxY - minY;
  
  // Ensure we don't divide by zero for edge cases
  if (trackWidth <= 0 || trackHeight <= 0) {
    return (
      <div className="flex items-center justify-center h-[700px] text-muted-foreground">
        Invalid track data - no dimensions available
      </div>
    );
  }
  
  // Dynamic padding based on container size (minimum 20px, maximum 8% of container)
  const dynamicPadding = Math.min(Math.max(width * 0.03, 20), width * 0.08);
  
  // Available space after padding
  const availableWidth = width - (dynamicPadding * 2);
  const availableHeight = height - (dynamicPadding * 2);
  
  // Calculate scale to maximize usage of available space while maintaining aspect ratio
  const scaleX = availableWidth / trackWidth;
  const scaleY = availableHeight / trackHeight;
  const scale = Math.min(scaleX, scaleY);
  
  // Calculate actual scaled dimensions
  const scaledTrackWidth = trackWidth * scale;
  const scaledTrackHeight = trackHeight * scale;
  
  // Center the track in the available space
  const offsetX = (width - scaledTrackWidth) / 2;
  const offsetY = (height - scaledTrackHeight) / 2;
  
  // Calculate stroke width based on scale (thicker lines for smaller tracks)
  const strokeWidth = Math.max(2, Math.min(8, scale * 0.01));
  
  // Create line segments with colors
  const segments = [];
  for (let i = 0; i < data.telemetry.length - 1; i++) {
    const current = data.telemetry[i];
    const next = data.telemetry[i + 1];
    
    // Transform coordinates with improved centering
    const x1 = (current.x - minX) * scale + offsetX;
    const y1 = (current.y - minY) * scale + offsetY;
    const x2 = (next.x - minX) * scale + offsetX;
    const y2 = (next.y - minY) * scale + offsetY;
    
    // Choose color based on which driver was faster
    const color = current.fastest_driver_int === 1 ? data.driver1_color : data.driver2_color;
    
    segments.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    );
  }

  return (
    <div className="w-1/2 h-1/2 flex flex-col mx-auto">
      {/* Title */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          {data.driver1} vs {data.driver2} - {data.session_info.year} {data.session_info.event_name} {data.session_info.session_name}
        </h3>
      </div>
      
      {/* SVG Track */}
      <div className="flex-1 flex justify-center items-center min-h-0">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          className="border border-border rounded-lg bg-card max-w-full max-h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background */}
          <rect width={width} height={height} fill="transparent" />
          
          {/* Track segments */}
          <g>
            {segments}
          </g>
        </svg>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center mt-4 space-x-6">
        <div className="flex items-center space-x-2">
          <div 
            className="w-4 h-4 rounded"
            style={{ backgroundColor: data.driver1_color }}
          />
          <span className="text-sm text-foreground font-medium">{data.driver1}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div 
            className="w-4 h-4 rounded"
            style={{ backgroundColor: data.driver2_color }}
          />
          <span className="text-sm text-foreground font-medium">{data.driver2}</span>
        </div>
      </div>
      
      {/* Description */}
      <div className="text-center mt-2">
        <p className="text-xs text-muted-foreground">
          Track colored by fastest driver per mini-sector
        </p>
      </div>
    </div>
  );
}