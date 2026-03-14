'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Turn One route error boundary:', error);
  }, [error]);

  return (
    <main className="site-pages relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(225,29,72,0.22),transparent_38%),radial-gradient(circle_at_80%_80%,rgba(220,38,38,0.16),transparent_35%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/75 to-black" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16 sm:px-10">
        <div className="w-full rounded-3xl border border-white/10 bg-zinc-950/85 p-8 shadow-[0_0_50px_rgba(225,29,72,0.18)] backdrop-blur-sm sm:p-12">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-1 text-sm font-semibold text-red-300">
            <AlertTriangle className="h-4 w-4" />
            System Fault Detected
          </div>

          <h1 className="text-balance text-3xl font-black uppercase tracking-wide sm:text-5xl">
            Pit Lane Interruption
          </h1>
          <p className="mt-4 max-w-2xl text-base text-zinc-300 sm:text-lg">
            We hit an unexpected issue while loading this section. Our telemetry team has been notified, and you can retry now or return to the main grid.
          </p>

          {error?.digest ? (
            <p className="mt-5 text-xs uppercase tracking-[0.18em] text-zinc-500">
              Error Ref: {error.digest}
            </p>
          ) : null}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="glow-effect inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white"
            >
              <RotateCcw className="h-4 w-4" />
              Retry Section
            </button>

            <Link
              href="/home"
              className="accent-glow inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold"
            >
              <Home className="h-4 w-4" />
              Go to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
