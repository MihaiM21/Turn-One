import { WrenchIcon } from 'lucide-react';
import Link from 'next/link';

const PAGE_LABELS: Record<string, string> = {
  live: 'Live Timing',
  generator: 'Race Generator',
  predictions: 'Predictions',
  simracing: 'Sim Racing',
};

interface MaintenanceScreenProps {
  /** Page slug — used to look up the display name */
  slug: string;
  /** Custom message from the admin, or undefined to show a default */
  message?: string;
}

/**
 * Full-page maintenance screen rendered when an admin disables a page.
 * Purely presentational — receives props from the usePageMaintenance hook result.
 */
export function MaintenanceScreen({ slug, message }: MaintenanceScreenProps) {
  const pageName = PAGE_LABELS[slug] ?? slug;
  const displayMessage =
    message?.trim() ||
    'This page is temporarily unavailable while we perform maintenance. Please check back soon.';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-black via-red-950/20 to-black px-4">
      {/* Decorative top stripe */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />

      <div className="relative flex flex-col items-center gap-8 text-center max-w-lg">
        {/* Icon */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-red-500/20 blur-2xl scale-150" />
          <div className="relative h-24 w-24 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center">
            <WrenchIcon className="h-10 w-10 text-red-400" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          {/* Eyebrow */}
          <p className="text-xs font-bold uppercase tracking-widest text-red-500">
            Under Maintenance
          </p>

          <h1 className="text-4xl font-black tracking-tight text-white">
            {pageName}
          </h1>

          <p className="text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {displayMessage}
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1 h-px bg-red-500/20" />
          <span className="text-xs text-muted-foreground/40 uppercase tracking-widest font-bold">
            Turn One
          </span>
          <div className="flex-1 h-px bg-red-500/20" />
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card/60 px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:border-red-500/40 hover:bg-red-500/5 hover:text-white"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
