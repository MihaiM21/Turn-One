"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Home, Zap, Bell, User } from "lucide-react"
import Link from "next/link"
import {
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useNotificationStats } from "@/hooks/use-notification-stats"

export function DashboardHeader() {
  const { stats } = useNotificationStats()
  
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 animate-in slide-in-from-top-2 duration-500">
      <div className="container mx-auto px-4 py-3 sm:py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-3">
              <div className="hidden h-7 w-px bg-border/60 sm:block" />
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">Dashboard</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:scale-105 transition-all duration-300 relative"
              >
                <Link href="/notifications">
                  <Bell className="h-4 w-4" />
                  {stats.unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {stats.unreadCount > 9 ? '9+' : stats.unreadCount}
                    </Badge>
                  )}
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:scale-105 transition-all duration-300"
              >
                <Link href="/">
                  <Home className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:scale-105 transition-all duration-300"
              >
                <Link href="/settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:scale-105 transition-all duration-300"
              >
                <Link href="/account">
                  <User className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
