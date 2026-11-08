import type { Metadata } from "next";
import { generateSEO, SITE_CONFIG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { MainNav } from "@/components/navigation/main-nav";
import { WindTunnelHero } from "@/components/landing/hero";
import { LapBezel } from "@/components/landing/lap-bezel";
import { Broadcast, ChannelSection, HowItWorks, LeaderboardTeaser, SupportedSims } from "@/components/landing/sim-sections";
import { Eyebrow, Faq, FinalCta, container, faqJsonLd, softwareJsonLd } from "@/components/landing/sections";
import { channelUrl, getLatestChannelVideos } from "@/lib/server/youtube-feed";

// Leaderboard and channel sections are fetched server-side; refresh every 5 minutes.
export const revalidate = 300;

export const metadata: Metadata = generateSEO({
  title: "Sim Racing Telemetry for ACC, F1 25 and iRacing",
  description:
    "Find the tenth in every corner. Turn One Link records every lap in ACC, EA SPORTS F1 25/26 and iRacing; the web shows where you lose time, corner by corner, against your best and verified leaderboards.",
  url: "/",
  image: "/og-images/turn-one-landing.jpg",
  keywords: [
    "sim racing telemetry",
    "ACC telemetry",
    "F1 25 telemetry",
    "iRacing telemetry",
    "lap analysis",
    "sim racing leaderboards",
  ],
});

export default async function RootPage() {
  const videos = await getLatestChannelVideos(3);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={[softwareJsonLd(SITE_CONFIG.url), faqJsonLd()]} />
      <MainNav />
      <main>
        <WindTunnelHero />
        <HowItWorks />

        {/* The product, from a real lap — the thing the hero is selling */}
        <section id="lap" aria-labelledby="lap-title" className={`${container} scroll-mt-20 pb-16 md:pb-24`}>
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>Inside Turn One</Eyebrow>
            <h2 id="lap-title" className="font-display mt-3 text-balance text-4xl leading-[0.95] sm:text-5xl">
              See exactly where the time went.
            </h2>
          </div>
          <LapBezel className="mt-10" />
        </section>

        <SupportedSims />
        <LeaderboardTeaser />
        <Broadcast />
        <ChannelSection videos={videos} channelUrl={channelUrl()} />
        <Faq />
        <FinalCta />
      </main>
    </div>
  );
}
