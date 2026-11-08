"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { isNavItemActive, type NavGroup, type NavItem } from "@/lib/navigation/dashboard-nav"

function NavItemRow({ item, active }: { item: NavItem; active: boolean }) {
  const { isMobile, setOpenMobile } = useSidebar()
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title} isActive={active}>
        <Link
          href={item.url}
          aria-current={active ? "page" : undefined}
          // The mobile sheet stays open after a client navigation unless we close it.
          onClick={() => isMobile && setOpenMobile(false)}
        >
          <item.icon />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
      {item.plan ? (
        <SidebarMenuBadge className="font-display text-[10px] tracking-wider text-muted-foreground">
          {item.plan}
        </SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  )
}

function GroupItems({ group, path }: { group: NavGroup; path: string }) {
  return (
    <SidebarMenu>
      {group.items.map((item) => (
        <NavItemRow key={item.url} item={item} active={isNavItemActive(item, path)} />
      ))}
    </SidebarMenu>
  )
}

function CollapsibleGroup({ group, path }: { group: NavGroup; path: string }) {
  const hasActive = group.items.some((item) => isNavItemActive(item, path))
  // Opens itself when you navigate into it; otherwise the user's toggle wins.
  const [open, setOpen] = React.useState(hasActive)
  React.useEffect(() => {
    if (hasActive) setOpen(true)
  }, [hasActive])

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel asChild className="eyebrow text-[11px] hover:text-sidebar-foreground">
          <CollapsibleTrigger>
            {group.label}
            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <GroupItems group={group} path={path} />
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

export function NavMain({ groups }: { groups: NavGroup[] }) {
  // App Router client navigations don't emit `popstate`; usePathname is the supported way to watch the route.
  const path = usePathname() ?? ""

  return (
    <>
      {groups.map((group) =>
        group.collapsible ? (
          <CollapsibleGroup key={group.id} group={group} path={path} />
        ) : (
          <SidebarGroup key={group.id} className={group.label ? undefined : "pb-0"}>
            {group.label ? (
              <SidebarGroupLabel className="eyebrow text-[11px]">{group.label}</SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent>
              <GroupItems group={group} path={path} />
            </SidebarGroupContent>
          </SidebarGroup>
        ),
      )}
    </>
  )
}
