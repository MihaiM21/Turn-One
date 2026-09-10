import type { Metadata } from "next";
import { Monitor, MessageCircle } from "lucide-react";
import { MainNav } from "@/components/navigation/main-nav";
import { PublicCard } from "@/components/site/public-card";
import { SOCIAL_LINKS } from "@/lib/social-links";

export const metadata: Metadata = {
  title: "Turn One Desktop | Turn One",
  description: "A desktop app for guaranteed live F1 timing, in development.",
};

export default function LiveDesktopAppPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <MainNav />

      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"
        aria-hidden
      />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center border border-zinc-800 bg-zinc-950">
          <Monitor className="h-7 w-7 text-primary" />
        </div>

        <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Coming soon · Desktop app</p>

        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight sm:text-5xl">Turn One Desktop</h1>

        <p className="mt-4 max-w-lg text-sm text-zinc-400 sm:text-base">
          F1&apos;s live-timing feed blocks connections from hosting-provider IPs, which limits live
          timing on the web. A desktop app is in development that connects directly from your own
          machine, so live data works reliably.
        </p>

        <PublicCard className="mt-10 w-full max-w-md p-6">
          <a
            href={SOCIAL_LINKS.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <MessageCircle className="h-4 w-4" />
            Join the Discord for updates
          </a>
        </PublicCard>
      </main>
    </div>
  );
}
