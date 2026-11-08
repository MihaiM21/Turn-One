"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { BadgeCheck, Bell, ChevronsUpDown, Coins, LogOut, Sparkles, Zap } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth/auth-provider"
import { useBalance } from "@/components/providers/balance-provider"
import { useNotificationStats } from "@/hooks/use-notification-stats"
import { usePlan } from "@/hooks/use-plan"

function Balance({ coins, tokens }: { coins: number; tokens: number }) {
  return (
    <span className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
      <span className="flex items-center gap-1 text-instrument">
        <Coins className="size-3" aria-hidden />
        {coins.toLocaleString()}
      </span>
      <span className="flex items-center gap-1 text-primary">
        <Zap className="size-3" aria-hidden />
        {tokens}
      </span>
    </span>
  )
}

export function NavUser({ user }: { user: { name: string; email: string; avatar: string } }) {
  const { isMobile } = useSidebar()
  const { logout } = useAuth()
  const { coins, tokens } = useBalance()
  const { stats } = useNotificationStats()
  const { plan } = usePlan()
  const router = useRouter()

  const initials = (user.name || "T1").substring(0, 2).toUpperCase()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="border border-sidebar-border data-[state=open]:bg-sidebar-accent"
              tooltip={user.name}
            >
              <Avatar className="size-8 rounded-md border border-sidebar-border">
                <AvatarImage src={user.avatar} alt="" />
                <AvatarFallback className="rounded-md bg-surface text-[11px] font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="flex items-center gap-2 truncate text-sm font-semibold">
                  {user.name}
                  <span className="font-display text-[10px] tracking-wider text-muted-foreground">{plan}</span>
                </span>
                <Balance coins={coins} tokens={tokens} />
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={6}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="grid leading-tight">
                <span className="truncate text-sm font-semibold">{user.name}</span>
                {user.email ? <span className="truncate text-[11px] text-muted-foreground">{user.email}</span> : null}
              </div>
            </DropdownMenuLabel>
            {plan === "BASIC" ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="text-xs">
                    <Link href="/pricing">
                      <Sparkles className="size-3.5" />
                      See Pro features
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="text-xs">
                <Link href="/account">
                  <BadgeCheck className="size-3.5" />
                  Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-xs">
                <Link href="/notifications" className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Bell className="size-3.5" />
                    Notifications
                  </span>
                  {stats.unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-auto h-4 px-1.5 text-[10px]">
                      {stats.unreadCount}
                    </Badge>
                  )}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-xs">
              <LogOut className="size-3.5" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
