'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ServerErrorPage() {
  return (
    <main className="site-pages relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(225,29,72,0.24),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(220,38,38,0.18),transparent_36%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/80 to-black" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16 sm:px-10">
        <Card className="w-full border-white/10 bg-zinc-950/90 shadow-[0_0_55px_rgba(225,29,72,0.22)] backdrop-blur">
          <CardHeader className="space-y-4 pb-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-1 text-sm font-semibold text-red-300">
              <AlertTriangle className="h-4 w-4" />
              Service Temporarily Unavailable
            </div>
            <CardTitle className="text-balance text-3xl font-black uppercase tracking-wide sm:text-5xl">
              Engine Room Is Offline
            </CardTitle>
            <p className="max-w-2xl text-base text-zinc-300 sm:text-lg">
              Turn One could not reach required backend services. This is usually temporary and resolves within a few minutes.
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                className="glow-effect inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold"
                onClick={() => window.location.reload()}
              >
                <RefreshCcw className="h-4 w-4" />
                Retry Now
              </Button>

              <Button
                asChild
                variant="outline"
                className="accent-glow inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold"
              >
                <Link href="/home">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
