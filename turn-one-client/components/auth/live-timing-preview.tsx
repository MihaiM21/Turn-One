type Compound = "S" | "M" | "H"

interface Row {
  pos: number
  code: string
  gap: string
  compound: Compound
}

const rows: Row[] = [
  { pos: 1, code: "VER", gap: "LEADER", compound: "M" },
  { pos: 2, code: "NOR", gap: "+3.241", compound: "M" },
  { pos: 3, code: "PIA", gap: "+5.882", compound: "H" },
  { pos: 4, code: "HAM", gap: "+9.441", compound: "S" },
]

const compoundClasses: Record<Compound, string> = {
  S: "bg-primary/20 text-primary border-primary/40",
  M: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  H: "bg-white/10 text-foreground border-white/30",
}

export function LiveTimingPreview() {
  return (
    <div className="rounded-lg border border-border bg-card/60 backdrop-blur-sm p-4 font-mono text-sm">
      <div className="flex items-center justify-between text-[10px] tracking-widest text-muted-foreground mb-3">
        <span>LIVE TIMING</span>
        <span className="inline-flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          LAP 34/57
        </span>
      </div>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.code} className="flex items-center gap-3">
            <span className="w-4 text-muted-foreground">{row.pos}</span>
            <span className={`w-12 font-bold ${row.pos === 1 ? "text-primary" : "text-foreground"}`}>
              {row.code}
            </span>
            <span className="flex-1 text-muted-foreground">{row.gap}</span>
            <span
              className={`inline-flex size-5 items-center justify-center rounded-sm border text-[10px] font-bold ${compoundClasses[row.compound]}`}
            >
              {row.compound}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
