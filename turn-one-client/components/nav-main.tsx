"use client"

import * as React from "react"
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
  const [currentPath, setCurrentPath] = React.useState<string>("");

  // Update current path when component mounts and when pathname changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const updatePath = () => {
        setCurrentPath(window.location.pathname);
      };
      
      // Set initial path
      updatePath();
      
      // Listen for path changes
      window.addEventListener('popstate', updatePath);
      
      return () => {
        window.removeEventListener('popstate', updatePath);
      };
    }
  }, []);

  // Check if an item is active based on the current path
  const isItemActive = (itemUrl: string): boolean => {
    // Exact match for home or dashboard
    if (itemUrl === '/' && currentPath === '/') return true;
    
    // For other pages, check if current path starts with the item URL
    // This ensures that sub-routes also highlight the parent menu item
    if (itemUrl !== '/' && currentPath.startsWith(itemUrl)) return true;
    
    return false;
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const active = isItemActive(item.url);
          
          return (
            <Collapsible key={item.title} asChild defaultOpen={item.isActive || active}>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={item.title} isActive={active}>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
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
                                <a href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </a>
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
