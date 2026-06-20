import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CtaRowProps = {
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  className?: string;
};

export function CtaRow({ primary, secondary, className }: CtaRowProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      <Button
        asChild
        size="lg"
        className="group rounded-none bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Link href={primary.href}>
          {primary.label}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </Button>
      {secondary && (
        <Button
          asChild
          variant="outline"
          size="lg"
          className="rounded-none border-zinc-700 bg-transparent text-zinc-200 hover:border-zinc-500 hover:bg-zinc-900"
        >
          <Link href={secondary.href}>{secondary.label}</Link>
        </Button>
      )}
    </div>
  );
}
