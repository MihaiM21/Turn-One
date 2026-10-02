import type { Metadata } from "next";
import { generateSEO, SITE_CONFIG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { MainNav } from "@/components/navigation/main-nav";
import { WindTunnelHero } from "@/components/landing/hero";
import { ProductBezel, Sectors } from "@/components/landing/product-sections";
import { LatestSessions, Regs2026, seasonStats } from "@/components/landing/season-sections";
import { Eyebrow, Faq, FinalCta, ProofBand, container, faqJsonLd, softwareJsonLd } from "@/components/landing/sections";

// "Latest from 2026" and the rounds-run stat come from the calendar; refresh hourly.
export const revalidate = 3600;

export const metadata: Metadata = generateSEO({
  title: "F1 Live Timing, Telemetry & Race Predictions",
  description:
    "See the race the way the pit wall does. Free F1 live timing, telemetry that explains itself, and race predictions for the 2026 season — in the browser, on any screen.",
  url: "/",
  image: "/og-images/turn-one-landing.jpg",
  keywords: ["F1 2026 regulations", "F1 active aero", "F1 overtake mode", "F1 telemetry explained"],
});

export default function RootPage() {
  const now = new Date();
  return (
    <div className="min-h-screen bg-[#020202] text-white">
      <JsonLd data={[softwareJsonLd(SITE_CONFIG.url), faqJsonLd()]} />
      <MainNav />
      <main>
        <WindTunnelHero />

        {/* The product itself, straight after the car — the thing the wind tunnel is selling */}
        <section aria-labelledby="inside-title" className={`${container} pt-16 md:pt-24`}>
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>What you get inside</Eyebrow>
            <h2 id="inside-title" className="mt-3 text-balance text-3xl font-black tracking-tight text-white sm:text-4xl">
              A live race control room, in the browser.
            </h2>
          </div>
          <ProductBezel className="mt-10" />
        </section>

        <Sectors />
        <Regs2026 />
        <LatestSessions now={now} />
        <ProofBand stats={seasonStats(now)} />
        <Faq />
        <FinalCta />
      </main>
    </div>
  );
}
