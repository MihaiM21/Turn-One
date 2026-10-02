import Link from "next/link";
import { cn } from "@/lib/utils";
import { DashboardFragment, Fragment, TelemetryFragment, TimingTowerFragment } from "./ui-fragments";
import { container } from "./sections";
import { PILLARS } from "./data";

/**
 * The product-forward pieces first built for Concept C, shared so Concept E
 * can stack them under its wind-tunnel hero: the dashboard in a browser bezel,
 * and the three "sector" split rows (copy left, real UI fragment right).
 */

export function ProductBezel({ className }: { className?: string }) {
  return (
    <div className={cn("mx-auto max-w-5xl", className)}>
      <div className="overflow-hidden rounded-t-lg border border-zinc-700/80 bg-[#060606] shadow-[0_-20px_80px_-20px_rgba(212,9,36,0.25)]">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="ml-3 truncate font-mono text-[10px] text-zinc-500">turnonehub.com/dashboard</span>
        </div>
        <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3 lg:p-4">
          <div className="border border-zinc-800 bg-black p-4"><DashboardFragment /></div>
          <div className="border border-zinc-800 bg-black p-4"><TimingTowerFragment /></div>
          <div className="border border-zinc-800 bg-black p-4 sm:col-span-2 lg:col-span-1"><TelemetryFragment /></div>
        </div>
      </div>
    </div>
  );
}

// F1 sector colours (purple/green/yellow) used only as the tiny tag — flagged
// in the research doc as a tokens decision; everything else stays crimson/white.
const TAG = ["bg-purple-500", "bg-emerald-500", "bg-yellow-400"];

export function Sectors() {
  const sectors = PILLARS.filter((p) => p.id !== "hub");
  return (
    <section className={cn(container, "divide-y divide-zinc-800")}>
      {sectors.map((p, i) => (
        <article
          key={p.id}
          className={cn(
            "grid items-center gap-8 py-16 md:grid-cols-2 md:gap-12 md:py-24",
            i % 2 === 1 && "md:[&>*:first-child]:order-2",
          )}
        >
          <div>
            <div className="flex items-center gap-3">
              <span className={cn("h-2 w-8", TAG[i])} aria-hidden />
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">Sector {i + 1}</span>
            </div>
            <h2 className="mt-4 text-balance text-3xl font-black tracking-tight text-white sm:text-4xl">{p.title}</h2>
            <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-zinc-300">{p.body}</p>
            <Link
              href={p.href}
              className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-400 hover:text-red-300"
            >
              {p.cta} →
            </Link>
          </div>
          <div className="border border-zinc-800 bg-[#060606] p-5 sm:p-6">
            <Fragment id={p.id} />
          </div>
        </article>
      ))}
    </section>
  );
}
