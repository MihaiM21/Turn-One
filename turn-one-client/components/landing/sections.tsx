import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQ, HERO, PLANS } from "./data";

/* ── Primitives ─────────────────────────────────────────────────────────── */

/** The CHROME dark plate. Copy never sits bare over the render. */
export function Plate({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-border bg-background/80 p-5 backdrop-blur-md sm:p-6", className)}>
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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 font-display text-sm tracking-[0.08em] transition-colors",
        variant === "primary"
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border border-border text-foreground/85 hover:border-muted-foreground/50 hover:text-foreground",
        className,
      )}
    >
      {children}
      {variant === "primary" && <ArrowRight className="h-3.5 w-3.5" />}
    </Link>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("eyebrow text-[11px] text-primary", className)}>{children}</p>;
}

export const container = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

/* ── Page sections ──────────────────────────────────────────────────────── */

export function Faq() {
  return (
    <section className="border-t border-border">
      <div className={cn(container, "grid gap-8 py-16 md:grid-cols-[1fr_2fr] md:py-24")}>
        <div>
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="font-display mt-3 text-4xl leading-none text-foreground">Questions</h2>
        </div>
        <div className="divide-y divide-border">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-foreground">
                <h3>{f.q}</h3>
                <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="border-t border-border bg-card">
      <div className={cn(container, "flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between")}>
        <div>
          <h2 className="font-display text-balance text-4xl leading-none text-foreground sm:text-5xl">{HERO.h1}</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Closed beta from January 2027 · Windows ·{" "}
            <Link href={HERO.tertiary.href} className="text-foreground/85 underline-offset-4 hover:underline">
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
    "@type": "SoftwareApplication",
    name: "Turn One",
    url: siteUrl,
    image: `${siteUrl}/og-images/turn-one-landing.jpg`,
    applicationCategory: "SportsApplication",
    operatingSystem: "Windows 10, Windows 11 (Turn One Link); any browser (analysis)",
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
