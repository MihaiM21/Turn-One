"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  // App Router client navigations do not emit `popstate`, and the 'routeChange'
  // event this used to listen for is never dispatched anywhere in the app.
  // usePathname is the supported way to observe the current route.
  const currentPath = usePathname() ?? "";
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({});

  // Check if an item is active based on the current path. Requires an exact
  // match or a `/`-bounded prefix so a route like `/live2` doesn't also
  // highlight a sibling nav item at `/live`.
  const isItemActive = (itemUrl: string): boolean => {
    if (itemUrl === '/') return currentPath === '/';
    return currentPath === itemUrl || currentPath.startsWith(itemUrl + '/');
  };

  // Auto-expand sections when navigating to their sub-items. Uses a single
  // functional update so it reads the live `openItems` rather than a value
  // captured from the render that scheduled the effect.
  React.useEffect(() => {
    setOpenItems((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const item of items) {
        if (next[item.title] !== undefined) continue;

        const active = isItemActive(item.url);
        const hasActiveSubItem = item.items?.some((subItem) => isItemActive(subItem.url)) ?? false;
        if (item.isActive || active || hasActiveSubItem) {
          next[item.title] = true;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isItemActive is derived from currentPath
  }, [currentPath, items]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const active = isItemActive(item.url);
          // Check if any subitem is active to keep the section expanded
          const hasActiveSubItem = item.items?.some(subItem => isItemActive(subItem.url)) || false;
          const shouldBeOpen = item.isActive || active || hasActiveSubItem;
          
          // Determine if this item should be open
          const isOpen = openItems[item.title] !== undefined 
            ? openItems[item.title] 
            : shouldBeOpen;
          
          return (
            <Collapsible 
              key={item.title} 
              asChild 
              open={isOpen}
              onOpenChange={(open) => {
                setOpenItems(prev => ({
                  ...prev,
                  [item.title]: open
                }));
              }}
            >
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={item.title} isActive={active} size="sm">
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRight />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const subItemActive = isItemActive(subItem.url);
                          
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={subItemActive}>
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
