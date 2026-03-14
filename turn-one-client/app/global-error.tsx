'use client';

import Link from 'next/link';
import { AlertOctagon, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body className="site-pages min-h-screen bg-black text-white antialiased">
        <main className="relative min-h-screen overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(225,29,72,0.24),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(220,38,38,0.18),transparent_36%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/80 to-black" />

          <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16 sm:px-10">
            <div className="w-full rounded-3xl border border-white/10 bg-zinc-950/90 p-8 shadow-[0_0_55px_rgba(225,29,72,0.22)] backdrop-blur sm:p-12">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-1 text-sm font-semibold text-red-300">
                <AlertOctagon className="h-4 w-4" />
                Critical Service Error
              </div>

              <h1 className="text-balance text-3xl font-black uppercase tracking-wide sm:text-5xl">
                Turn One Is Recovering
              </h1>
              <p className="mt-4 max-w-2xl text-base text-zinc-300 sm:text-lg">
                A core part of the application failed while rendering. Please retry once, or return to the homepage while systems come back online.
              </p>

              {error?.digest ? (
                <p className="mt-5 text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Incident Ref: {error.digest}
                </p>
              ) : null}

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={reset}
                  className="glow-effect inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white"
                >
                  Retry App
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
      </body>
    </html>
  );
}
