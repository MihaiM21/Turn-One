"use client";

import { useState, useEffect } from "react";
import { Rocket, Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ObfuscatedEmail } from "@/components/ui/obfuscated-email";
import { MainNav } from "@/components/navigation/main-nav";
import { PublicCard } from "@/components/site/public-card";

export default function ApiLaunchPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showAlt, setShowAlt] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setShowAlt((p) => !p), 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        (process.env.NODE_ENV === "development" ? "http://localhost:5271/api" : "https://backend.t1f1.com/api");
      const response = await fetch(`${API_URL}/ApiWishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("Failed to subscribe");
      setIsSubmitted(true);
      toast.success("You're on the list! We'll notify you when we launch.");
      setEmail("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <MainNav />

      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" aria-hidden />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center border border-zinc-800 bg-zinc-950 animate-in fade-in zoom-in-95 duration-500">
          <Rocket className="h-7 w-7 text-primary" />
        </div>

        <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Coming soon · Public API</p>

        <h1 className="mt-3 text-5xl font-black uppercase tracking-tight sm:text-6xl">T1 API</h1>

        <p className="mt-4 text-xl text-zinc-300 sm:text-2xl">
          Launching{" "}
          <span className="font-mono font-black text-primary transition-opacity duration-500">
            {showAlt ? "Q3 2026" : "soon"}
          </span>
        </p>

        <p className="mt-4 max-w-xl text-sm text-zinc-400 sm:text-base">
          Real-time Formula 1 telemetry, live timing, historical archives and WebSocket feeds.
          Join the wishlist to be first in line.
        </p>

        {/* Wishlist form */}
        <div className="mt-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-500">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Bell className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 rounded-none border-zinc-800 bg-zinc-950 pl-10 focus-visible:border-primary focus-visible:ring-0"
                />
              </div>
              <Button
                type="submit"
                className="h-11 rounded-none bg-primary px-6 text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
              >
                Join wishlist
              </Button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-3 border border-green-500/30 bg-green-500/10 p-4 text-sm font-medium text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              You&apos;re on the list.
            </div>
          )}
        </div>

        {/* Preview features */}
        <div className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { title: "Live timing", desc: "Real-time race data over WebSocket." },
            { title: "Historical data", desc: "Full F1 archive, decades back." },
            { title: "Webhooks", desc: "Push notifications for the events you care about." },
          ].map((f) => (
            <PublicCard key={f.title} hover className="p-5 text-left">
              <p className="text-sm font-bold uppercase tracking-tight">{f.title}</p>
              <p className="mt-1 text-sm text-zinc-400">{f.desc}</p>
            </PublicCard>
          ))}
        </div>

        <p className="mt-12 text-xs text-zinc-500">
          Questions? Reach us at <ObfuscatedEmail user="contact" domain="t1f1.com" />
        </p>
      </main>
    </div>
  );
}
