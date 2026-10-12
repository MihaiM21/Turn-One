import { driverName } from "@/lib/f1/driver-names"
import type { ResultRow, ThrottleRow, TopSpeedRow } from "@/lib/plots/server-fetch"

// Server-rendered tables: the same data the charts draw, as real HTML so it is
// in the first response (crawlable, readable without JS, usable by screen
// readers). The charts below them are the visual layer, not the only copy.

const th = "px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500"
const td = "px-3 py-2 text-sm text-zinc-300"
const num = "px-3 py-2 text-right font-mono text-sm tabular-nums text-zinc-300"

function Swatch({ color }: { color?: string }) {
  return <span aria-hidden className="mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ backgroundColor: color || "#52525b" }} />
}

export function ResultsTable({ rows, caption }: { rows: ResultRow[]; caption: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-zinc-800">
            <th scope="col" className={th}>Pos</th>
            <th scope="col" className={th}>Driver</th>
            <th scope="col" className={th}>Team</th>
            <th scope="col" className={`${th} text-right`}>Lap time</th>
            <th scope="col" className={`${th} text-right`}>Gap</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.Driver}-${i}`} className="border-b border-zinc-900">
              <td className={`${td} font-mono tabular-nums`}>{i + 1}</td>
              <th scope="row" className={`${td} font-medium text-white`}>
                <Swatch color={r.Color} />
                {driverName(r.Driver)} <span className="text-xs font-normal text-zinc-500">{r.Driver}</span>
              </th>
              <td className={td}>{r.Team ?? "—"}</td>
              <td className={num}>{r.LapTime}</td>
              <td className={num}>{i === 0 ? "—" : `+${r.LapTimeDelta.toFixed(3)}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TopSpeedTable({ rows }: { rows: TopSpeedRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[320px] border-collapse">
        <caption className="sr-only">Highest recorded speed per team, in km/h</caption>
        <thead>
          <tr className="border-b border-zinc-800">
            <th scope="col" className={th}>Pos</th>
            <th scope="col" className={th}>Team</th>
            <th scope="col" className={`${th} text-right`}>Top speed (km/h)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.team}-${i}`} className="border-b border-zinc-900">
              <td className={`${td} font-mono tabular-nums`}>{i + 1}</td>
              <th scope="row" className={`${td} font-medium text-white`}>
                <Swatch color={r.color} />
                {r.team}
              </th>
              <td className={num}>{r.speed.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ThrottleTable({ rows }: { rows: ThrottleRow[] }) {
  const sorted = [...rows].sort((a, b) => b.throttle - a.throttle)
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[320px] border-collapse">
        <caption className="sr-only">Average throttle application per driver, in percent</caption>
        <thead>
          <tr className="border-b border-zinc-800">
            <th scope="col" className={th}>Pos</th>
            <th scope="col" className={th}>Driver</th>
            <th scope="col" className={`${th} text-right`}>Avg. throttle (%)</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={`${r.driver}-${i}`} className="border-b border-zinc-900">
              <td className={`${td} font-mono tabular-nums`}>{i + 1}</td>
              <th scope="row" className={`${td} font-medium text-white`}>
                <Swatch color={r.color} />
                {driverName(r.driver)} <span className="text-xs font-normal text-zinc-500">{r.driver}</span>
              </th>
              <td className={num}>{r.throttle.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
