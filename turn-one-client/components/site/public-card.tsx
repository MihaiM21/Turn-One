import { cn } from "@/lib/utils";
import { ReactNode, HTMLAttributes } from "react";

type PublicCardProps = HTMLAttributes<HTMLDivElement> & {
  accent?: boolean;
  hover?: boolean;
};

export function PublicCard({ accent, hover, className, children, ...rest }: PublicCardProps) {
  return (
    <div
      {...rest}
      className={cn(
        "border border-zinc-800 bg-zinc-950",
        accent && "border-l-4 border-l-primary",
        hover && "transition-colors hover:border-zinc-700 hover:bg-zinc-900",
        className,
      )}
    >
      {children}
    </div>
  );
}

type MetricProps = {
  label: string;
  value: ReactNode;
  unit?: string;
  className?: string;
};

export function Metric({ label, value, unit, className }: MetricProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-black tabular-nums text-foreground">{value}</span>
        {unit && <span className="text-xs font-mono text-zinc-500">{unit}</span>}
      </div>
    </div>
  );
}
