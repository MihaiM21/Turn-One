'use client';

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Crown } from 'lucide-react'
import { TeammateBattleData, TeammateBattleTeam } from '@/types/plot-types-v2'
import { AdvancedPlotSettings } from '@/types/plot-types'
import { fetchDriverHeadshots } from '@/lib/openf1'

interface TeammateBattleGraphProps {
  data: TeammateBattleData
  advancedSettings?: AdvancedPlotSettings
}

// Some teams (e.g. new/unbranded entries) come through with a near-white
// color, which makes white badge text disappear — pick readable text color
// based on the background's luminance instead of always using white.
function contrastText(hex: string): string {
  const clean = (hex ?? '').replace('#', '')
  if (clean.length !== 6) return '#ffffff'
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6),16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#18181b' : '#ffffff'
}

// Real photos come from OpenF1's headshot_url (backed by F1's own media
// CDN, which serves a generic silhouette if a driver has no photo). We
// still fall back to a colored initials badge if the image fails to load
// or no headshot was found for that driver code.
function DriverBadge({
  code,
  color,
  won,
  headshotUrl,
}: {
  code: string
  color: string
  won: boolean
  headshotUrl?: string
}) {
  const [imgError, setImgError] = useState(false)
  const showImage = !!headshotUrl && !imgError

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <div
          className="h-12 w-12 overflow-hidden rounded-full shadow-lg ring-2 ring-zinc-700"
          style={{ backgroundColor: color }}
        >
          {showImage ? (
            <Image
              src={headshotUrl!}
              alt={code}
              width={48}
              height={48}
              unoptimized
              className="h-full w-full object-cover object-top"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-sm font-bold"
              style={{ color: contrastText(color) }}
            >
              {code}
            </div>
          )}
        </div>
        {won && (
          <Crown className="absolute -top-2.5 left-1/2 h-4 w-4 -translate-x-1/2 fill-yellow-400 text-yellow-400" />
        )}
      </div>
    </div>
  )
}

function H2HBar({
  aCode,
  bCode,
  color,
  aWins,
  bWins,
  label,
}: {
  aCode: string
  bCode: string
  color: string
  aWins: number
  bWins: number
  label: string
}) {
  const total = aWins + bWins || 1
  const aPct = (aWins / total) * 100

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
        <p className="font-mono text-xs text-zinc-400">
          <span className={aWins >= bWins ? 'font-bold text-zinc-100' : ''}>{aWins}</span>
          {' – '}
          <span className={bWins >= aWins ? 'font-bold text-zinc-100' : ''}>{bWins}</span>
        </p>
      </div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-l-full transition-all"
          style={{ width: `${aPct}%`, backgroundColor: color, opacity: 0.95 }}
        />
        <div
          className="h-full rounded-r-full transition-all"
          style={{ width: `${100 - aPct}%`, backgroundColor: color, opacity: 0.4 }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-zinc-500">
        <span>{aCode}</span>
        <span>{bCode}</span>
      </div>
    </div>
  )
}

function TeamCard({ team: t, headshots }: { team: TeammateBattleTeam; headshots: Map<string, string> }) {
  const raceWinsA = t.race_h2h[0]
  const raceWinsB = t.race_h2h[1]
  const teamInitials = t.team
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()

  return (
    <div
      className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/40"
      style={{ borderTopColor: t.color || '#3f3f46', borderTopWidth: 3 }}
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded text-[9px] font-bold ring-1 ring-zinc-700"
            style={{ backgroundColor: t.color, color: contrastText(t.color) }}
          >
            {teamInitials}
          </div>
          <p className="text-sm font-semibold text-zinc-100">{t.team}</p>
        </div>
        <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-500">
          {t.rounds_counted} rounds counted
        </span>
      </div>

      <div className="flex items-center justify-center gap-4 px-4 py-3">
        <DriverBadge code={t.driver_a} color={t.color} won={raceWinsA > raceWinsB} headshotUrl={headshots.get(t.driver_a)} />
        <span className="text-xs font-semibold text-zinc-600">VS</span>
        <DriverBadge code={t.driver_b} color={t.color} won={raceWinsB > raceWinsA} headshotUrl={headshots.get(t.driver_b)} />
      </div>

      <div className="grid grid-cols-1 gap-3 px-4 pb-3 sm:grid-cols-2">
        <H2HBar
          label="Qualifying H2H"
          aCode={t.driver_a}
          bCode={t.driver_b}
          color={t.color}
          aWins={t.quali_h2h[0]}
          bWins={t.quali_h2h[1]}
        />
        <H2HBar
          label="Race H2H"
          aCode={t.driver_a}
          bCode={t.driver_b}
          color={t.color}
          aWins={raceWinsA}
          bWins={raceWinsB}
        />
      </div>

      <div className="border-t border-zinc-800/80 px-4 py-2 text-xs text-zinc-500">
        Avg quali gap ({t.driver_b} − {t.driver_a}):{' '}
        <span className="font-mono text-zinc-300">
          {t.avg_quali_gap_s > 0 ? '+' : ''}
          {t.avg_quali_gap_s.toFixed(3)}s
        </span>
      </div>
    </div>
  )
}

// Each team has its own pair of driver names, so a single shared-axis
// recharts chart doesn't generalize cleanly across rows. A per-team
// versus-card list reads far better for small (best-of-N) win counts.
export function TeammateBattleGraph({ data, advancedSettings }: TeammateBattleGraphProps) {
  const settings = advancedSettings || {
    showGrid: true,
    showLegend: true,
    animateChart: true,
    chartHeight: 700,
    lineThickness: 2,
    showDataLabels: true,
  }

  const [headshots, setHeadshots] = useState<Map<string, string>>(new Map())
  useEffect(() => {
    let cancelled = false
    fetchDriverHeadshots().then((map) => {
      if (!cancelled) setHeadshots(map)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!data || !data.teams || data.teams.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No teammate battle data available
      </div>
    )
  }

  const s = settings.textScale ?? 1

  return (
    <div
      className="space-y-3 overflow-y-auto"
      style={{ maxHeight: `${settings.chartHeight}px`, fontSize: `${s}rem` }}
    >
      {data.teams.map((t) => (
        <TeamCard key={t.team} team={t} headshots={headshots} />
      ))}
    </div>
  )
}
