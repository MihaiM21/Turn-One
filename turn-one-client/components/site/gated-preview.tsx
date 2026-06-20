"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";
import { Lock, ArrowRight } from "lucide-react";
import { isAuthenticated } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";

type GatedPreviewProps = {
  children: ReactNode;
  teaser?: string;
  cta?: { label: string; href: string };
  intensity?: "sm" | "md" | "lg";
  unlocked?: boolean;
  className?: string;
};

export function GatedPreview({
  children,
  teaser = "Sign in to unlock the full breakdown",
  cta,
  intensity = "md",
  unlocked,
  className,
}: GatedPreviewProps) {
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, []);

  const isUnlocked = unlocked ?? authed === true;

  if (isUnlocked) {
    return <div className={className}>{children}</div>;
  }

  const blur = intensity === "sm" ? "blur-sm" : intensity === "lg" ? "blur-md" : "blur-[6px]";
  const ctaHref = cta?.href ?? `/auth/login?redirect=${encodeURIComponent(pathname ?? "/")}`;
  const ctaLabel = cta?.label ?? "Sign in to unlock";

  return (
    <div className={cn("relative", className)}>
      <div className={cn("pointer-events-none select-none", blur)} aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-transparent px-4 text-center">
        <div className="flex items-center gap-2 border border-primary/30 bg-zinc-950/80 px-3 py-1.5">
          <Lock className="h-3 w-3 text-primary" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-primary">Members only</span>
        </div>
        <p className="max-w-sm text-sm text-zinc-300">{teaser}</p>
        <Link
          href={ctaHref}
          className="group inline-flex items-center gap-2 border border-zinc-700 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
