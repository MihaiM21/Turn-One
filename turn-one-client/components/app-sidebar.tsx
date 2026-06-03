"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  ChartNoAxesCombined,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Shield,
  SquareTerminal,
  Activity,
  Gamepad2,
  Gauge,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { useAuth } from "@/components/auth/auth-provider"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Live Dashboard",
      url: "/live",
      icon: Activity,
    },
    {
      title: "Generator",
      url: "/generator",
      icon: ChartNoAxesCombined,
    },
    {
      title: "Simracing",
      url: "/simracing",
      icon: Gauge,
      items: [
        {
          title: "Dashboard",
          url: "/simracing",
        },
        {
          title: "Live Telemetry",
          url: "/simracing/live",
        },
        {
          title: "My Sessions",
          url: "/simracing/sessions",
        },
        {
          title: "AI Coach",
          url: "/simracing/coach",
        },
        {
          title: "Live Streams",
          url: "/simracing/spectate",
        },
        {
          title: "Streamer Mode",
          url: "/simracing/streamer",
        },
        {
          title: "Leaderboards",
          url: "/simracing/leaderboards",
        },
      ],
    },
    {
      title: "Game",
      url: "/hub",
      icon: Gamepad2,
      items: [
        {
          title: "Hub",
          url: "/hub",
        },
        {
          title: "Coin store",
          url: "/store",
        },
        {
          title: "Rewards",
          url: "/rewards",
        },
      ],
    },
    {
      title: "Documentation",
      url: "/docs",
      icon: BookOpen,
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "/contact",
      icon: LifeBuoy,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  data.user.name = user?.username || 'User';
  data.user.email = user?.email || 'user@example.com';
  data.user.avatar = user?.avatar || '/basic-avatar.webp';

  // Check if user is admin by decoding JWT token from localStorage
  const isAdmin = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      // Decode JWT payload (base64)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role === 'ADMIN' || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] === 'ADMIN';
    } catch {
      return false;
    }
  }, [user]);

  // Create navigation items with conditional admin section
  const navigationItems = React.useMemo(() => {
    const baseItems = [...data.navMain];
    
    if (isAdmin) {
      baseItems.push({
        title: "Admin Panel",
        url: "/admin",
        icon: Shield,
        isActive: false,
      });
    }
    
    return baseItems;
  }, [isAdmin]);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-grey text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  {/* <Command className="size-4" /> */}
                  <img src="/logo.png" alt="Turn One logo" className="size-10 object-contain" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Turn One</span>
                  <span className="truncate text-xs">Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigationItems} />
        {/* <NavProjects projects={data.projects} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
