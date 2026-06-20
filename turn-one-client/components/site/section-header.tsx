import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeader({ eyebrow, title, subtitle, align = "left", className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500",
        align === "center" && "text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">{eyebrow}</p>
      )}
      <h2 className="text-4xl font-black uppercase tracking-tight leading-none sm:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="max-w-2xl text-sm text-zinc-400 sm:text-base">{subtitle}</p>
      )}
    </div>
  );
}
