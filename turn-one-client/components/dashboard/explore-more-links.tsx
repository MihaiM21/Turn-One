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
  type LucideIcon 
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
  { href: "/live2", label: "Advanced Live Timing", description: "Enhanced live race tracking with SignalR", icon: Activity },
  { href: "/generator", label: "Plot Generator", description: "Create custom F1 telemetry visualizations", icon: BarChart3 },
  { href: "/games", label: "Game Hub", description: "Predictions, trivia and competitions", icon: Gamepad2 },
  { href: "/rewards", label: "Rewards & Leveling", description: "Earn XP and Turn One Coins", icon: Coins },
  { href: "/predictions", label: "Predictions", description: "Make Formula 1 race predictions", icon: Trophy },
  { href: "/account", label: "Account Settings", description: "Manage your F1 profile and preferences", icon: User },
  { href: "/docs", label: "Documentation", description: "API docs, guides and tutorials", icon: FileText },
];

interface ExploreMoreLinksProps {
  /** The current page path to exclude from the links */
  currentPage: string;
  /** Optional max number of links to show. Defaults to 4. */
  maxLinks?: number;
}

export function ExploreMoreLinks({ currentPage, maxLinks = 4 }: ExploreMoreLinksProps) {
  const links = allPages
    .filter((page) => page.href !== currentPage)
    .slice(0, maxLinks);

  return (
    <nav aria-label="Explore more pages" className="mt-12 mb-8 border-t border-border/20 pt-8">
      <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Explore More</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {links.map((page) => {
          const Icon = page.icon;
          return (
            <Link
              key={page.href}
              href={page.href}
              className="group flex items-start gap-3 rounded-lg border border-border/20 bg-background/50 p-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 group-hover:bg-primary/20 transition-colors">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {page.label}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {page.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
