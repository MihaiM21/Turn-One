'use client';

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { PitStrategyData } from '@/types/plot-types-v2'
import { AdvancedPlotSettings } from '@/types/plot-types'

interface PitStrategyGraphProps {
  data: PitStrategyData
  advancedSettings?: AdvancedPlotSettings
}

export function PitStrategyGraph({ data, advancedSettings }: PitStrategyGraphProps) {
  const settings = advancedSettings || {
    showGrid: true,
    showLegend: true,
    animateChart: true,
    chartHeight: 700,
    lineThickness: 2,
    showDataLabels: true,
  }

  if (!data || !data.stops || data.stops.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No pit strategy data available
      </div>
    )
  }

  const s = settings.textScale ?? 1
  const tickFontSize = Math.round(13 * s)

  const fastest = data.summary?.fastest_stop
  const stopsChartData = data.stops.map((stop) => ({
    label: `${stop.driver} #${stop.stop_n}`,
    driver: stop.driver,
    pit_lane_time_s: stop.pit_lane_time_s,
    isFastest: !!fastest && stop.driver === fastest.driver && stop.pit_lane_time_s === fastest.pit_lane_time_s,
  }))

  const teamAvgData = data.summary?.avg_stop_by_team ?? []
  const undercuts = data.undercuts ?? []
  const freeChanges = data.free_changes ?? []

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Pit stop durations</p>
        <div style={{ height: `${Math.round(settings.chartHeight * 0.45)}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stopsChartData} margin={{ top: 10 }}>
              {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
              <XAxis dataKey="label" stroke="#9CA3AF" tick={{ fontSize: tickFontSize }} angle={-35} textAnchor="end" height={70} interval={0} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: tickFontSize }} tickFormatter={(v) => `${Number(v).toFixed(1)}s`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F9FAFB' }}
                itemStyle={{ color: '#F9FAFB' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                formatter={(value: any) => [`${Number(value).toFixed(3)}s`, 'Pit lane time']}
              />
              <Bar dataKey="pit_lane_time_s" isAnimationActive={settings.animateChart} activeBar={{ stroke: '#F9FAFB', strokeWidth: 2 }}>
                {stopsChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.isFastest ? '#22c55e' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {teamAvgData.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Team average pit lane time</p>
          <div style={{ height: `${Math.round(settings.chartHeight * 0.3)}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamAvgData} layout="vertical" margin={{ right: 30 }}>
                {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />}
                <XAxis type="number" stroke="#9CA3AF" tick={{ fontSize: tickFontSize }} tickFormatter={(v) => `${Number(v).toFixed(1)}s`} />
                <YAxis dataKey="team" type="category" stroke="#F9FAFB" width={140} interval={0} tick={{ fontSize: tickFontSize }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F9FAFB' }}
                  itemStyle={{ color: '#F9FAFB' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  formatter={(value: any, _name: any, item: any) => [`${Number(value).toFixed(3)}s (${item?.payload?.n_stops ?? 0} stops)`, 'Avg']}
                />
                <Bar dataKey="avg_pit_lane_time_s" fill="#a855f7" radius={[0, 4, 4, 0]} isAnimationActive={settings.animateChart} activeBar={{ fill: '#c084fc', stroke: '#F9FAFB', strokeWidth: 2 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {undercuts.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Undercuts</p>
          <div className="border border-zinc-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900/60 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-2 text-left">Attacker</th>
                  <th className="px-3 py-2 text-left">Attacked</th>
                  <th className="px-3 py-2 text-right">Gain</th>
                  <th className="px-3 py-2 text-right">Worked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {undercuts.map((u, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{u.attacker ?? '-'}</td>
                    <td className="px-3 py-2">{u.attacked ?? '-'}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {typeof u.gain_s === 'number' ? `${u.gain_s > 0 ? '+' : ''}${u.gain_s.toFixed(3)}s` : '-'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Badge variant="outline" className={u.worked ? 'border-green-500/50 text-green-400' : 'border-red-500/50 text-red-400'}>
                        {u.worked ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {freeChanges.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Free tyre changes</p>
          <div className="border border-zinc-800 divide-y divide-zinc-800">
            {freeChanges.map((f, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>{f.driver} — lap {f.lap}</span>
                <span className="font-mono text-xs text-zinc-400">{f.compound_in} → {f.compound_out}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
