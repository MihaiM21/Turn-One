"use client"

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

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import {fetchTokenStatus, fetchUserProfile} from "@/lib/userService"
import { useState } from "react"
import { TokenStatus, UserProfile } from "@/types/user-types"
import { toast } from "./ui/use-toast"
import { useEffect } from "react"
import Link from "next/link"
import { useNotificationStats } from "@/hooks/use-notification-stats"
import { Badge as BadgeUI } from "@/components/ui/badge"


export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const [profileData, setProfileData] = useState<UserProfile>({
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
      lastLogin: ""
    })
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null)
  const { isAuthenticated } = useAuth()
  const { stats } = useNotificationStats()

  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
      if (isAuthenticated) {
        loadUserData()
      }
    }, [isAuthenticated])

  const handleLogout = () => {
    logout();
    router.push('/');
  };
  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('token') || ''
      
      // Load profile data from auth/me endpoint
      const profileResponse = await fetchUserProfile(token)
      setProfileData(profileResponse)

      // Load token status from subscription/token-status
      try {
        const tokenResponse = await fetchTokenStatus(token)
        setTokenStatus(tokenResponse)
      } catch (error) {
        console.log('No token status data available')
      }

    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={profileData.avatarUrl} alt={profileData.username} />
                <AvatarFallback className="rounded-lg">T1</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{profileData.username}</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Coins className="h-3 w-3" />
                    {profileData.coins.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {profileData.tokens}
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={profileData.avatarUrl} alt={profileData.username} />
                  <AvatarFallback className="rounded-lg">T1</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{profileData.username}</span>
                  <span className="truncate text-xs">{profileData.email}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      {profileData.coins.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {profileData.tokens}
                    </span>
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link href="/account">
                <DropdownMenuItem>     
                    <BadgeCheck />
                    Account
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <Link href="/notifications">
                <DropdownMenuItem className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell />
                    Notifications
                  </div>
                  {stats.unreadCount > 0 && (
                    <BadgeUI variant="destructive" className="ml-auto">
                      {stats.unreadCount}
                    </BadgeUI>
                  )}
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
