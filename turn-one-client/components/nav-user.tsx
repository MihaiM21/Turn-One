"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  Coins,
  Zap,
} from "lucide-react"

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
import { SidebarMenu, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth/auth-provider"
import { fetchTokenStatus, fetchUserProfile } from "@/lib/userService"
import { TokenStatus, UserProfile } from "@/types/user-types"
import { useNotificationStats } from "@/hooks/use-notification-stats"
import { Badge as BadgeUI } from "@/components/ui/badge"
import { useBalanceRefresh } from "@/lib/balance-events"

const emptyProfile: UserProfile = {
  id: "",
  email: "",
  username: "",
  avatarUrl: "",
  plan: "BASIC",
  planStartDate: "",
  planEndDate: "",
  autoRenew: false,
  coins: 0,
  tokens: 0,
  lastTokenRefillDate: "",
  createdAt: "",
  lastLogin: "",
}

export function NavUser({
  user,
}: {
  user: { name: string; email: string; avatar: string }
}) {
  const { isMobile } = useSidebar()
  const [profileData, setProfileData] = useState<UserProfile>(emptyProfile)
  const [, setTokenStatus] = useState<TokenStatus | null>(null)
  const { isAuthenticated, logout } = useAuth()
  const { stats } = useNotificationStats()
  const router = useRouter()

  const loadUserData = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const token = localStorage.getItem("token") || ""
      const profileResponse = await fetchUserProfile(token)
      setProfileData(profileResponse)
      try {
        const tokenResponse = await fetchTokenStatus(token)
        setTokenStatus(tokenResponse)
      } catch {
        // token status optional
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) loadUserData()
  }, [isAuthenticated, loadUserData])

  useBalanceRefresh(loadUserData)

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const displayName = profileData.username || user.name
  const initials = (displayName || "T1").substring(0, 2).toUpperCase()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/80 px-3 py-2.5 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 data-[state=open]:border-zinc-700 data-[state=open]:bg-zinc-900/70"
            >
              <Avatar className="h-8 w-8 shrink-0 rounded-lg border border-zinc-800">
                <AvatarImage src={profileData.avatarUrl} alt={displayName} />
                <AvatarFallback className="rounded-lg bg-zinc-900 text-[11px] font-semibold text-zinc-300">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate text-sm font-bold tracking-tight">{displayName}</span>
                <div className="mt-0.5 flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-yellow-400/90">
                    <Coins className="h-3 w-3" />
                    <span className="font-mono tabular-nums">{profileData.coins.toLocaleString()}</span>
                  </span>
                  <span className="flex items-center gap-1 text-primary/90">
                    <Zap className="h-3 w-3" />
                    <span className="font-mono tabular-nums">{profileData.tokens}</span>
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-zinc-600" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl border-zinc-800 bg-zinc-950/95 p-1 backdrop-blur"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={6}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 border-b border-zinc-800 px-3 py-3">
                <Avatar className="h-8 w-8 rounded-lg border border-zinc-800">
                  <AvatarImage src={profileData.avatarUrl} alt={displayName} />
                  <AvatarFallback className="rounded-lg bg-zinc-900 text-[11px] font-semibold text-zinc-300">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 leading-tight">
                  <span className="truncate text-sm font-bold tracking-tight">{displayName}</span>
                  <span className="truncate text-[11px] text-zinc-500">{profileData.email || user.email}</span>
                  <div className="mt-1 flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1 text-yellow-400/90">
                      <Coins className="h-3 w-3" />
                      <span className="font-mono tabular-nums">{profileData.coins.toLocaleString()}</span>
                    </span>
                    <span className="flex items-center gap-1 text-primary/90">
                      <Zap className="h-3 w-3" />
                      <span className="font-mono tabular-nums">{profileData.tokens}</span>
                    </span>
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem className="rounded-lg text-xs">
                <Sparkles className="h-3.5 w-3.5" />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuGroup>
              <Link href="/account">
                <DropdownMenuItem className="rounded-lg text-xs">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Account
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem className="rounded-lg text-xs">
                <CreditCard className="h-3.5 w-3.5" />
                Billing
              </DropdownMenuItem>
              <Link href="/notifications">
                <DropdownMenuItem className="flex items-center justify-between rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <Bell className="h-3.5 w-3.5" />
                    Notifications
                  </div>
                  {stats.unreadCount > 0 && (
                    <BadgeUI variant="destructive" className="ml-auto h-4 px-1.5 text-[10px]">
                      {stats.unreadCount}
                    </BadgeUI>
                  )}
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem onClick={handleLogout} className="rounded-lg text-xs">
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
