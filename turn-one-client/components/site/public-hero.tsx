import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type PublicHeroProps = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  cta?: ReactNode;
  backgroundImage?: string;
  className?: string;
  children?: ReactNode;
};

export function PublicHero({
  eyebrow,
  title,
  subtitle,
  cta,
  backgroundImage,
  className,
  children,
}: PublicHeroProps) {
  return (
    <section className={cn("relative overflow-hidden border-b border-zinc-800 bg-black", className)}>
      {backgroundImage && (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden
        />
      )}
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {eyebrow && (
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
          )}
          <h1 className="max-w-3xl text-5xl font-black uppercase tracking-tight leading-none sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          {subtitle && (
            <p className="max-w-2xl text-base text-zinc-400 sm:text-lg">{subtitle}</p>
          )}
          {cta && <div className="pt-2">{cta}</div>}
          {children}
        </div>
      </div>
    </section>
  );
}
