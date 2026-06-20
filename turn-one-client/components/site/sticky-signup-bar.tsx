"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { isAuthenticated } from "@/lib/auth-utils";

const DISMISS_KEY = "t1.signupBar.dismissedAt";
const SESSION_DISMISS_KEY = "t1.signupBar.sessionDismissed";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const HIDE_ON_PATHS = ["/contact", "/auth"];

export function StickySignupBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isAuthenticated()) return;
    if (HIDE_ON_PATHS.some((p) => pathname?.startsWith(p))) return;

    try {
      if (sessionStorage.getItem(SESSION_DISMISS_KEY)) return;
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_TTL_MS) return;
    } catch {
      // localStorage may be blocked; show the bar anyway
    }

    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur animate-in slide-in-from-bottom-4 duration-500">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-zinc-200">Free account</span>
          <span className="text-zinc-700">·</span>
          <span className="font-mono text-zinc-400">30 tokens</span>
          <span className="hidden text-zinc-700 sm:inline">·</span>
          <span className="hidden text-zinc-400 sm:inline">No credit card</span>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-1.5 bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="border border-zinc-800 p-1.5 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
