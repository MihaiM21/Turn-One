'use client';

import {Line, LineChart, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { LapTimeData } from '@/types/plot-types';


export function LapTimeAnalysisGraph({ lapTimeData }: { lapTimeData: LapTimeData[] }) {
    // Tire compound color mapping
    const compoundColors = {
      'SOFT': '#FF0000',      // Red
      'MEDIUM': '#FFFF00',    // Yellow  
      'HARD': '#FFFFFF',      // White
      'INTERMEDIATE': '#00FF00', // Green
      'WET': '#0000FF',       // Blue
    };

    // Filter outliers (lap times > 110% of median)
    const filterOutliers = (data: LapTimeData[]) => {
      if (data.length === 0) return data;
      
      // Calculate median lap time
      const sortedTimes = [...data].map(d => d.lap_times_seconds).sort((a, b) => a - b);
      const median = sortedTimes[Math.floor(sortedTimes.length / 2)];
      const threshold = median * 1.10; // 110% of median
      
      // Filter out outliers
      return data.filter(lap => lap.lap_times_seconds <= threshold);
    };

    const filteredData = filterOutliers(lapTimeData);

    // Custom tooltip to show formatted lap time and compound
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        const compound = data.compound || 'UNKNOWN';
        const compoundColor = compoundColors[compound as keyof typeof compoundColors] || '#9CA3AF';
        
        return (
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
            <p className="text-gray-300 font-medium">Lap {label}</p>
            <p className="text-blue-400 font-bold">
              Time: {data.lap_times_formatted}
            </p>
            <p className="text-gray-400 text-sm">
              ({data.lap_times_seconds.toFixed(3)}s)
            </p>
            <div className="flex items-center mt-2">
              <div 
                className="w-3 h-3 rounded-full mr-2 border border-gray-600 animate-pulse" 
                style={{ backgroundColor: compoundColor }}
              ></div>
              <span className="text-gray-300 text-sm">{compound}</span>
            </div>
          </div>
        );
      }
      return null;
    };

    // Create SVG path for connecting lines
    const createConnectionPath = (data: LapTimeData[]) => {
      if (data.length < 2) return '';
      
      return data.map((point, index) => {
        if (index === 0) return `M ${point.lap_numbers} ${point.lap_times_seconds}`;
        return `L ${point.lap_numbers} ${point.lap_times_seconds}`;
      }).join(' ');
    };

    // Custom dot component with animation
    const AnimatedDot = (props: any) => {
      const { cx, cy, payload } = props;
      const compound = payload.compound || 'UNKNOWN';
      const color = compoundColors[compound as keyof typeof compoundColors] || '#9CA3AF';
      
      return (
        <g>
          <circle 
            cx={cx} 
            cy={cy} 
            r={6} 
            fill={color} 
            stroke="#FFFFFF" 
            strokeWidth={2}
            className="animate-pulse hover:animate-bounce"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.3))',
              animation: `fadeInScale 0.6s ease-out ${props.index * 0.05}s both`
            }}
          />
        </g>
      );
    };

    return(
        <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
          <style jsx>{`
            @keyframes fadeInScale {
              0% {
                opacity: 0;
                transform: scale(0);
              }
              50% {
                opacity: 0.7;
                transform: scale(1.2);
              }
              100% {
                opacity: 1;
                transform: scale(1);
              }
            }
            
            @keyframes drawLine {
              0% {
                stroke-dasharray: 1000;
                stroke-dashoffset: 1000;
              }
              100% {
                stroke-dasharray: 1000;
                stroke-dashoffset:  -200;
              }
            }
          `}</style>
          
          <ResponsiveContainer width="100%" height={400}>
            <LineChart 
              data={filteredData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              className="animate-in fade-in-0 zoom-in-95 duration-1000"
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#374151" 
                className="animate-in fade-in-0 duration-1500"
              />
              <XAxis 
                dataKey="lap_numbers" 
                stroke="#9CA3AF"
                label={{ value: 'Lap Number', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                className="animate-in slide-in-from-bottom-2 duration-1000 delay-300"
              />
              <YAxis 
                stroke="#9CA3AF" 
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                label={{ value: 'Lap Time (seconds)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                className="animate-in slide-in-from-left-2 duration-1000 delay-300"
              />
              <Tooltip content={<CustomTooltip />} />
              
              <Line
                type="monotone"
                dataKey="lap_times_seconds"
                stroke="#6B7280"
                strokeWidth={2}
                strokeOpacity={1}
                dot={(props: any) => <AnimatedDot {...props} index={props.index} />}
                activeDot={{ r: 8, stroke: '#FFFFFF', strokeWidth: 3, className: 'animate-bounce' }}
                connectNulls={false}
                className="animate-in duration-2000 delay-700"
                style={{
                  animation: 'drawLine 2s ease-in-out 0.7s'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
          
          {/* Legend for tire compounds with animation */}
          <div className="flex flex-wrap justify-center gap-4 mt-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-1000 delay-1000">
            {Object.entries(compoundColors).map(([compound, color], index) => {
              const hasCompound = filteredData.some(lap => lap.compound === compound);
              if (!hasCompound) return null;
              
              return (
                <div 
                  key={compound} 
                  className="flex items-center hover:scale-110 transition-transform duration-200"
                  style={{ animationDelay: `${1.2 + index * 0.1}s` }}
                >
                  <div 
                    className="w-3 h-3 rounded-full mr-2 border border-gray-600 animate-pulse" 
                    style={{ 
                      backgroundColor: color,
                      filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.2))'
                    }}
                  ></div>
                  <span className="text-sm text-gray-300">{compound}</span>
                </div>
              );
            })}
          </div>
        </div>
    )
}