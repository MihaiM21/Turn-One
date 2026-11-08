import { SIMS } from "@/lib/simracing/sims";

/** The sims Turn One Link reads, next to the hero CTA. Text, not logos: they identify the subject. */
export function SimStrip({ className = "" }: { className?: string }) {
  const games = [
    { key: "acc", label: "ACC" },
    { key: "f1", label: "F1 25 · F1 26" },
    { key: "iracing", label: "iRacing" },
  ];
  const experimental = SIMS.filter((s) => s.experimental);
  return (
    <ul aria-label="Supported sims" className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {games.map((g) => (
        <li
          key={g.key}
          className="rounded border border-border bg-background/70 px-2.5 py-1 font-display text-xs tracking-[0.08em] text-foreground/85 backdrop-blur-sm"
        >
          {g.label}
        </li>
      ))}
      {experimental.map((s) => (
        <li key={s.id} className="px-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {s.short} experimental
        </li>
      ))}
    </ul>
  );
}
