"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface DiamondLoaderProps {
  /** px size of the diamond box */
  size?: number;
  /** primary line under the shape — tells the user what is loading */
  label?: string;
  /** optional secondary line */
  sublabel?: string;
  /** "flat" matches the live2 / zinc uppercase idiom */
  tone?: "default" | "flat";
  /** wrap in a full-page fixed overlay */
  fullscreen?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// A single square, rotated 45° into a diamond. Drawn as one <rect> so the
// four corners are clean miter joins — no overlapping segments.
const RECT = { x: 5.5, y: 5.5, size: 13 } as const;
const CENTER = RECT.x + RECT.size / 2;

export function DiamondLoader({
  size = 48,
  label,
  sublabel,
  tone = "default",
  fullscreen = false,
  className,
  children,
}: DiamondLoaderProps) {
  const flat = tone === "flat";

  const stack = (
    <div className={cn("flex flex-col items-center gap-3 text-center", className)}>
      <div className="animate-diamond-pulse" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          role="status"
          aria-label={label ?? "Loading"}
          className="h-full w-full text-primary [filter:drop-shadow(0_0_4px_var(--primary))]"
        >
          <g transform={`rotate(45 ${CENTER} ${CENTER})`}>
            {/* faint full square — keeps the shape readable behind the sweep */}
            <rect
              x={RECT.x}
              y={RECT.y}
              width={RECT.size}
              height={RECT.size}
              rx={1}
              stroke="currentColor"
              strokeWidth={1.4}
              className="diamond-base opacity-[0.16]"
            />
            {/* trailing glow of the racing arc */}
            <rect
              x={RECT.x}
              y={RECT.y}
              width={RECT.size}
              height={RECT.size}
              rx={1}
              pathLength={100}
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              className="animate-diamond-race opacity-40"
              style={{ strokeDasharray: "26 74" }}
            />
            {/* bright head of the racing arc */}
            <rect
              x={RECT.x}
              y={RECT.y}
              width={RECT.size}
              height={RECT.size}
              rx={1}
              pathLength={100}
              stroke="currentColor"
              strokeWidth={2.6}
              strokeLinecap="round"
              className="animate-diamond-race"
              style={{ strokeDasharray: "10 90" }}
            />
          </g>
        </svg>
      </div>
      {label ? (
        <p
          className={cn(
            flat
              ? "text-xs uppercase tracking-[0.2em] text-zinc-400"
              : "text-sm font-medium",
          )}
        >
          {label}
        </p>
      ) : null}
      {sublabel ? (
        <p className={cn("text-xs", flat ? "text-zinc-600" : "text-muted-foreground")}>
          {sublabel}
        </p>
      ) : null}
      {children}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        {stack}
      </div>
    );
  }
  return stack;
}
