import Link from "next/link";
import {
  LayoutDashboard,
  Activity,
  Signal,
  BarChart3,
  Trophy,
  Coins,
  User,
  FileText,
  Gamepad2,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

interface PageLink {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

const allPages: PageLink[] = [
  { href: "/dashboard", label: "Dashboard", description: "F1 telemetry overview and session data", icon: LayoutDashboard },
  { href: "/live", label: "Live Timing", description: "Real-time Formula 1 race timing", icon: Signal },
  { href: "/live2", label: "Advanced Live", description: "Enhanced live race tracking with SignalR", icon: Activity },
  { href: "/generator", label: "Plot Generator", description: "Create custom F1 telemetry visualizations", icon: BarChart3 },
  { href: "/games", label: "Game Hub", description: "Predictions, trivia and competitions", icon: Gamepad2 },
  { href: "/rewards", label: "Rewards", description: "Earn XP and Turn One Coins", icon: Coins },
  { href: "/predictions", label: "Predictions", description: "Make Formula 1 race predictions", icon: Trophy },
  { href: "/account", label: "Account", description: "Manage your profile and preferences", icon: User },
  { href: "/docs", label: "Docs", description: "API docs, guides and tutorials", icon: FileText },
];

interface ExploreMoreLinksProps {
  currentPage: string;
  maxLinks?: number;
}

export function ExploreMoreLinks({ currentPage, maxLinks = 4 }: ExploreMoreLinksProps) {
  const links = allPages.filter((page) => page.href !== currentPage).slice(0, maxLinks);

  return (
    <nav aria-label="Explore more pages" className="border-t border-zinc-800 pt-5">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Explore</p>
          <h2 className="mt-0.5 text-lg font-bold tracking-tight">More to discover</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-0 divide-y divide-zinc-800 border border-zinc-800 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
        {links.map((page, i) => {
          const Icon = page.icon;
          return (
            <Link
              key={page.href}
              href={page.href}
              className={`group flex items-start gap-3 bg-zinc-950 px-5 py-4 transition-colors hover:bg-zinc-900 ${
                i > 0 ? 'sm:border-l sm:border-zinc-800' : ''
              }`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-primary" />
              <div className="min-w-0">
                <span className="block text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                  {page.label}
                </span>
                <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">{page.description}</p>
              </div>
              <ArrowRight className="ml-auto mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-700 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
