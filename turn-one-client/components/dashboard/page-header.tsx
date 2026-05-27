'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface PageHeaderStat {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconClassName?: string;
}

interface PageHeaderProps {
  label: string;
  title: string;
  description?: string;
  stats?: PageHeaderStat[];
  actions?: ReactNode;
}

export function PageHeader({ label, title, description, stats, actions }: PageHeaderProps) {
  return (
    <section className="border-b border-zinc-800/70 pb-5 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">{label}</p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {description && (
            <p className="mt-1.5 text-sm text-zinc-400">{description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {stats?.map(({ icon: Icon, label: statLabel, value, iconClassName }) => (
            <div key={statLabel} className="flex items-center gap-2.5">
              <Icon className={`h-4 w-4 ${iconClassName ?? 'text-primary'}`} />
              <div className="leading-tight">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">{statLabel}</p>
                <p className="font-mono text-lg font-black tabular-nums leading-none mt-0.5">{value}</p>
              </div>
            </div>
          ))}
          {actions}
        </div>
      </div>
    </section>
  );
}
