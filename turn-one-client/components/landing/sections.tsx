import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQ, HERO, PLANS } from "./data";

/* ── Primitives ─────────────────────────────────────────────────────────── */

/** The CHROME dark plate. Copy never sits bare over the render. */
export function Plate({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("border border-zinc-800/80 bg-black/75 p-5 backdrop-blur-md sm:p-6", className)}>
      {children}
    </div>
  );
}

export function Btn({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 px-5 text-xs font-semibold uppercase tracking-[0.2em] transition-colors",
        variant === "primary"
          ? "bg-red-600 text-white hover:bg-red-500"
          : "border border-zinc-700 text-zinc-200 hover:border-zinc-400 hover:text-white",
        className,
      )}
    >
      {children}
      {variant === "primary" && <ArrowRight className="h-3.5 w-3.5" />}
    </Link>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-[11px] font-medium uppercase tracking-[0.3em] text-red-400", className)}>{children}</p>
  );
}

export const container = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

/* ── Page sections ──────────────────────────────────────────────────────── */

export type Stat = { value: string; label: string };

/** Numbers derived from the real calendar/archive at build time, plus where the data comes from. No invented testimonials. */
export function ProofBand({ stats }: { stats: Stat[] }) {
  return (
    <section className="border-y border-zinc-800 bg-[#060606]">
      <div className={cn(container, "grid gap-8 py-12 md:grid-cols-[1fr_1px_1fr] md:gap-12 md:py-16")}>
        <dl className="grid grid-cols-2 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse">
              <dt className="mt-1 text-[10px] uppercase tracking-[0.25em] text-zinc-500">{s.label}</dt>
              <dd className="font-mono text-3xl font-black tabular-nums text-white sm:text-4xl">{s.value}</dd>
            </div>
          ))}
        </dl>
        <div className="hidden bg-zinc-800 md:block" />
        <div className="flex flex-col justify-center">
          <p className="text-balance text-lg leading-snug text-zinc-100 sm:text-xl">
            Built on the official live timing feed and the FastF1 / OpenF1 archives — the same numbers the teams see,
            with the reasoning written next to them.
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-zinc-500">
            Independent · Not affiliated with Formula 1
          </p>
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section className="border-t border-zinc-800">
      <div className={cn(container, "grid gap-8 py-16 md:grid-cols-[1fr_2fr] md:py-24")}>
        <div>
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Questions</h2>
        </div>
        <div className="divide-y divide-zinc-800">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-white">
                <h3>{f.q}</h3>
                <span className="text-zinc-500 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-prose text-sm leading-relaxed text-zinc-400">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="border-t border-zinc-800 bg-[#060606]">
      <div className={cn(container, "flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between")}>
        <div>
          <h2 className="text-balance text-2xl font-black tracking-tight text-white sm:text-3xl">{HERO.h1}</h2>
          <p className="mt-2 text-sm text-zinc-400">
            No install. Free during every session.{" "}
            <Link href={HERO.tertiary.href} className="text-zinc-200 underline-offset-4 hover:underline">
              {HERO.tertiary.label} →
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Btn href={HERO.primary.href}>{HERO.primary.label}</Btn>
          <Btn href={HERO.secondary.href} variant="ghost">
            {HERO.secondary.label}
          </Btn>
        </div>
      </div>
    </section>
  );
}

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function softwareJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Turn One",
    url: siteUrl,
    image: `${siteUrl}/og-images/turn-one-landing.jpg`,
    applicationCategory: "SportsApplication",
    operatingSystem: "Any (web browser)",
    browserRequirements: "Requires JavaScript and WebGL for the 3D car; everything else works without it.",
    description: HERO.sub,
    offers: PLANS.map((p) => ({
      "@type": "Offer",
      name: p.name,
      price: p.price,
      priceCurrency: "USD",
      url: `${siteUrl}/pricing`,
    })),
  };
}
