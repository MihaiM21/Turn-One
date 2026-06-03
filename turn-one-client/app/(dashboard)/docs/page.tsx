'use client';

import {
  ArrowRight,
  Signal,
  Database,
  ChartLine,
  BarChart,
  Timer,
  MapPin,
  Gauge,
  Wind,
  FileJson,
  Mail,
  ExternalLink,
  Play,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { DashboardHeader } from '@/components/dashboard/live dashboard/dashboard-header';
import { PageHeader } from '@/components/dashboard/page-header';
import { ExploreMoreLinks } from '@/components/dashboard/explore-more-links';

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="border-b border-zinc-800 px-5 py-3">
      <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">{label}</p>
      <p className="mt-0.5 font-bold text-sm">{title}</p>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="h-auto justify-start gap-3 rounded-none border-zinc-800 bg-zinc-950 px-5 py-4 text-left text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900/60 hover:text-primary"
    >
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span className="flex-1 font-medium">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
    </Button>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <li className="flex items-start gap-3 px-5 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-200">{title}</p>
        <p className="mt-0.5 text-[11px] text-zinc-500">{description}</p>
      </div>
    </li>
  );
}

function AnalysisBlock({
  icon: Icon,
  label,
  title,
  features,
}: {
  icon: LucideIcon;
  label: string;
  title: string;
  features: string[];
}) {
  return (
    <section className="border border-zinc-800 bg-zinc-950">
      <SectionHeader label={label} title={title} />
      <div className="flex items-center gap-2 border-b border-zinc-800/60 px-5 py-2.5">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] uppercase tracking-wider text-zinc-400">Includes</span>
      </div>
      <ul className="divide-y divide-zinc-800/60">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 px-5 py-2 text-[12px] text-zinc-400">
            <span className="h-1 w-1 shrink-0 bg-zinc-700" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function DocumentationPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleContact = () => {
    toast({
      title: 'Contact Request Sent',
      description: 'Our support team will contact you shortly.',
    });
    router.push('/contact');
  };

  const handleApiDocs = () => {
    window.open('https://docs.t1f1.com/', '_blank');
  };

  const handleTutorials = () => {
    window.open('https://www.youtube.com/channel/UCg-DYx-XQUFeEol-IHmCi_Q', '_blank');
  };

  return (
    <div className="min-h-screen bg-black">
      <DashboardHeader />

      <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6 space-y-4">
        <PageHeader
          label="Documentation"
          title="Turn One docs"
          description="Your comprehensive guide to mastering Turn One's F1 data analytics platform."
        />

        {/* Quick actions */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <ActionButton icon={Signal} label="Live dashboard" onClick={() => router.push('/live')} />
          <ActionButton icon={FileJson} label="API documentation" onClick={handleApiDocs} />
          <ActionButton icon={Play} label="Video tutorials" onClick={handleTutorials} />
        </div>

        {/* Getting started */}
        <section className="border border-zinc-800 border-l-4 border-l-primary bg-zinc-950">
          <SectionHeader label="Getting started" title="Platform overview" />
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-zinc-800/60">
            <div>
              <div className="border-b border-zinc-800/60 px-5 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Key features</p>
              </div>
              <ul className="divide-y divide-zinc-800/60">
                <Feature
                  icon={Signal}
                  title="Real-time telemetry"
                  description="Live F1 session data with sub-second latency."
                />
                <Feature
                  icon={ChartLine}
                  title="Advanced analytics"
                  description="Comprehensive performance analysis tools."
                />
                <Feature
                  icon={Database}
                  title="Historical data"
                  description="Access to the complete F1 data archive."
                />
              </ul>
            </div>
            <div className="flex flex-col">
              <div className="border-b border-zinc-800/60 px-5 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Quick setup</p>
              </div>
              <ol className="divide-y divide-zinc-800/60">
                {[
                  'Access the live dashboard',
                  'Connect to active F1 sessions',
                  'Configure your data preferences',
                  'Start analyzing real-time data',
                ].map((step, i) => (
                  <li key={step} className="flex items-center gap-3 px-5 py-3 text-[12px]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 font-mono text-[11px] tabular-nums text-primary">
                      {i + 1}
                    </span>
                    <span className="text-zinc-300">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-auto border-t border-zinc-800/60 px-5 py-3">
                <Button
                  onClick={() => router.push('/live')}
                  size="sm"
                  className="w-full rounded-sm bg-primary text-xs font-semibold uppercase tracking-wider text-white hover:bg-primary/90"
                >
                  Go to live dashboard
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Live dashboard */}
        <section className="border border-zinc-800 bg-zinc-950">
          <SectionHeader label="Live dashboard" title="Real-time monitoring" />
          <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x md:divide-zinc-800/60">
            {[
              {
                icon: Timer,
                title: 'Timing data',
                items: ['Lap times and intervals', 'Sector times', 'Speed traps', 'Gap analysis'],
              },
              {
                icon: Gauge,
                title: 'Telemetry',
                items: ['Speed and RPM', 'Throttle / brake', 'DRS status', 'Gear changes'],
              },
              {
                icon: Wind,
                title: 'Conditions',
                items: ['Track temperature', 'Weather data', 'Wind conditions', 'Rain probability'],
              },
            ].map(({ icon: Icon, title, items }) => (
              <div key={title}>
                <div className="flex items-center gap-2 border-b border-zinc-800/60 px-5 py-2.5">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">{title}</p>
                </div>
                <ul className="divide-y divide-zinc-800/60">
                  {items.map((item) => (
                    <li key={item} className="flex items-center gap-2 px-5 py-2 text-[12px] text-zinc-400">
                      <span className="h-1 w-1 shrink-0 bg-zinc-700" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Data analysis */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AnalysisBlock
            icon={BarChart}
            label="Performance"
            title="Lap time analysis"
            features={['Sector comparison', 'Stint analysis', 'Performance trends', 'Historical data']}
          />
          <AnalysisBlock
            icon={MapPin}
            label="Track intelligence"
            title="Track mapping"
            features={['Racing line analysis', 'Corner speed data', 'Overtaking zones', 'Position tracking']}
          />
        </div>

        {/* Advanced features */}
        <section className="border border-zinc-800 bg-zinc-950">
          <SectionHeader label="Advanced features" title="API & integration" />
          <div className="space-y-4 px-5 py-5">
            <div className="border border-zinc-800 bg-zinc-900/40 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">API authentication</p>
              <code className="mt-2 block font-mono text-xs tabular-nums text-zinc-300">
                Authorization: Bearer {'{your_api_key}'}
              </code>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <ActionButton icon={FileJson} label="API documentation" onClick={handleApiDocs} />
              <ActionButton icon={ExternalLink} label="Code examples" onClick={handleApiDocs} />
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="border border-zinc-800 bg-zinc-950">
          <SectionHeader label="Support" title="Need help?" />
          <div className="px-5 py-5">
            <p className="mb-4 text-xs text-zinc-500">
              Get support from our team of F1 data experts.
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <ActionButton icon={Mail} label="Contact support" onClick={handleContact} />
              <ActionButton icon={FileJson} label="API docs" onClick={handleApiDocs} />
              <ActionButton icon={BookOpen} label="Tutorials" onClick={handleTutorials} />
            </div>
          </div>
        </section>

        <ExploreMoreLinks currentPage="/docs" />
      </main>
    </div>
  );
}
