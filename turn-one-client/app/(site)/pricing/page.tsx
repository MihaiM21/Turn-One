import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, Zap, Trophy, Crown, Camera, ArrowRight } from "lucide-react";
import { MainNav } from "@/components/navigation/main-nav";
import { PublicHero } from "@/components/site/public-hero";
import { SectionHeader } from "@/components/site/section-header";
import { PublicCard } from "@/components/site/public-card";
import { CtaRow } from "@/components/site/cta-row";
import { generateSEO } from "@/lib/seo";


export const metadata: Metadata = generateSEO({
  title: "Pricing — Free Sim Racing Telemetry",
  description:
    "Recording and analysing your own sim laps is free. Paid plans add comparing against other drivers, corner-by-corner coaching tips, OBS overlays and spectating.",
  url: "/pricing",
  keywords: [
    "sim racing telemetry pricing",
    "free lap analysis",
    "ACC telemetry",
    "iRacing telemetry",
  ],
});

const plans = [
  {
    name: "Enthusiast",
    price: "0",
    period: "forever",
    tagline: "Record and analyse your own laps. No credit card.",
    icon: Zap,
    cta: { label: "Join the beta", href: "/auth/signup?intent=beta" },
    popular: false,
    // Sim features mirror Domain/PlanFeatures.cs (SimRacingPlanFeatures) — keep them in step.
    features: [
      { name: "Every lap recorded with Turn One Link", on: true },
      { name: "Sessions, lap and sector times, track maps", on: true },
      { name: "Overlay two of your own laps", on: true },
      { name: "Verified leaderboards and your driver page", on: true },
      { name: "F1 Archive: past session telemetry", on: true },
      { name: "30 tokens / month", on: true },
      { name: "Compare against other drivers' laps", on: false },
      { name: "Corner-by-corner comparison and coaching tips", on: false },
      { name: "OBS overlays and spectating", on: false },
    ],
  },
  {
    name: "Professional",
    price: "9.99",
    period: "month",
    tagline: "Find the time: compare against anyone and get corner-by-corner tips.",
    icon: Trophy,
    cta: { label: "Join waitlist", href: "/contact" },
    popular: true,
    features: [
      { name: "Everything in Enthusiast", on: true },
      { name: "Compare up to 8 laps, including other drivers'", on: true },
      { name: "Corner-by-corner comparison", on: true },
      { name: "Coaching tips per lap", on: true },
      { name: "Multi-channel traces and replay scrubber", on: true },
      { name: "OBS overlays for streaming", on: true },
      { name: "Spectate public live sessions", on: true },
      { name: "500 tokens / month", on: true },
      { name: "Priority email support", on: true },
    ],
  },
  {
    name: "Elite",
    price: "19.99",
    period: "month",
    tagline: "Everything, plus the coach chat when it launches and first access to new features.",
    icon: Crown,
    cta: { label: "Join waitlist", href: "/contact" },
    popular: false,
    features: [
      { name: "Everything in Professional", on: true },
      { name: "Coach chat about any lap (coming)", on: true },
      { name: "Unlimited tokens", on: true },
      { name: "Priority support", on: true },
      { name: "Beta features first", on: true },
    ],
  },
  {
    name: "Content Creator",
    price: "Custom",
    period: "contact us",
    tagline: "For YouTube channels, podcasts and pro creators.",
    icon: Camera,
    cta: { label: "Contact us", href: "/contact" },
    popular: false,
    features: [
      { name: "Everything in Elite", on: true },
      { name: "Unlimited everything", on: true },
      { name: "Custom branding & watermarks", on: true },
      { name: "4K export", on: true },
      { name: "Broadcast graphics", on: true },
      { name: "White-label options", on: true },
      { name: "Direct messaging support", on: true },
      { name: "Collab tooling", on: true },
      { name: "Revenue sharing", on: true },
      { name: "Featured spotlight", on: true },
      { name: "Custom feature requests", on: true },
    ],
  },
];

const faqs = [
  { q: "Can I buy a paid plan today?", a: "Not yet. Paid plans aren't open, so join the waitlist and we'll tell you when they are." },
  { q: "Where does the data come from?", a: "F1 session data we processed and archived, plus your own laps from Turn One Link. Turn One is unofficial and has no data licence from Formula 1." },
  { q: "Is Turn One really free forever?", a: "Yes. Paid plans are optional — they unlock perks and help fund the platform." },
  { q: "Do you offer team discounts?", a: "Yes — special pricing for teams and education. Contact us for details." },
  { q: "Why are recent F1 sessions missing?", a: "Since October 2026 F1's timing archive needs a paid F1 TV login, and its terms don't allow reuse on other sites. Sessions processed before then stay available." },
  { q: "What does paying get me?", a: "More tokens, faster processing, the historical archive and priority support." },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black">
      <MainNav />

      <PublicHero
        eyebrow="100% free forever · No credit card"
        title="Professional F1 telemetry, free."
        subtitle="Lap, speed and sector analysis for F1 fans and sim racers. No paywalls. Paid plans just unlock perks and support the platform."
        backgroundImage="/turn-one-car/2026-turn-one-car/0002.webp"
        cta={
          <CtaRow
            primary={{ label: "Start free", href: "/auth/signup" }}
            secondary={{ label: "Talk to us", href: "/contact" }}
          />
        }
      />

      <main className="mx-auto max-w-7xl space-y-20 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <section className="space-y-6">
          <SectionHeader
            eyebrow="Pick your level"
            title="Plans for fans, pros and creators"
            subtitle="Start on Enthusiast — upgrade anytime to support development and unlock advanced perks."
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((p) => (
              <PublicCard key={p.name} accent={p.popular} className="flex flex-col p-6">
                {/* {p.popular && (
                  <p className="mb-3 self-start border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] text-primary">
                    Most popular
                  </p>
                )} */}
                <div className="flex h-10 w-10 items-center justify-center border border-zinc-800 bg-zinc-900">
                  <p.icon className="h-4 w-4 text-primary" />
                </div>
                
                <p className="mt-4 text-base font-bold uppercase tracking-tight">{p.name}</p>
                <p className="mt-1 min-h-[40px] text-xs text-zinc-400">{p.tagline}</p>

                <div className="mt-5 border-t border-zinc-800 pt-4">
                  {p.price === "Custom" ? (
                    <>
                      <p className="font-mono text-3xl font-black tabular-nums text-primary">Custom</p>
                      <p className="text-xs text-zinc-500">{p.period}</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="font-mono text-4xl font-black tabular-nums text-primary">
                          ${p.price}
                        </span>
                        <span className="text-xs text-zinc-500">/{p.period}</span>
                      </div>
                    </>
                  )}
                </div>

                <ul className="mt-5 flex-1 space-y-2">
                  {p.features.map((f) => (
                    <li key={f.name} className="flex items-start gap-2 text-xs">
                      {f.on ? (
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      ) : (
                        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-700" />
                      )}
                      <span className={f.on ? "text-zinc-200" : "text-zinc-600 line-through"}>{f.name}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={p.cta.href}
                  className={`mt-6 inline-flex items-center justify-center gap-2 border px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                    p.popular
                      ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border-zinc-700 bg-transparent text-zinc-200 hover:border-zinc-500 hover:bg-zinc-900"
                  }`}
                >
                  {p.cta.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </PublicCard>
            ))}
          </div>
        </section>

        {/* Trust signals */}
        <section className="grid gap-4 md:grid-cols-3">
          {[
            { title: "No credit card", body: "All features immediately. No payment details required." },
            { title: "Community first", body: "Built by F1 fans for F1 fans. Your support helps us grow." },
            { title: "Always improving", body: "New features every month. Your feedback shapes the roadmap." },
          ].map((t) => (
            <PublicCard key={t.title} className="p-6">
              <p className="text-sm font-bold uppercase tracking-tight">{t.title}</p>
              <p className="mt-2 text-sm text-zinc-400">{t.body}</p>
            </PublicCard>
          ))}
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <SectionHeader eyebrow="FAQ" title="Everything you might ask" />
          <div className="grid gap-3 md:grid-cols-2">
            {faqs.map((f) => (
              <PublicCard key={f.q} className="p-5">
                <p className="text-sm font-bold text-primary">{f.q}</p>
                <p className="mt-2 text-sm text-zinc-400">{f.a}</p>
              </PublicCard>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="border border-zinc-800 bg-zinc-950 px-6 py-12 text-center sm:px-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">30 seconds to start</p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Free account · No installation · Works in your browser
          </h2>
          <div className="mt-6 flex justify-center">
            <CtaRow
              primary={{ label: "Start free", href: "/auth/signup" }}
              secondary={{ label: "Talk to our team", href: "/contact" }}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
