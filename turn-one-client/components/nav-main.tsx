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
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({});

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
      
      // Listen for Next.js navigation
      const handleRouteChange = () => {
        updatePath();
      };
      
      window.addEventListener('routeChange', handleRouteChange);
      
      return () => {
        window.removeEventListener('popstate', updatePath);
        window.removeEventListener('routeChange', handleRouteChange);
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

  // Auto-expand sections when navigating to their sub-items
  React.useEffect(() => {
    items.forEach((item) => {
      const active = isItemActive(item.url);
      const hasActiveSubItem = item.items?.some(subItem => isItemActive(subItem.url)) || false;
      const shouldBeOpen = item.isActive || active || hasActiveSubItem;
      
      if (shouldBeOpen && openItems[item.title] === undefined) {
        setOpenItems(prev => ({
          ...prev,
          [item.title]: true
        }));
      }
    });
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
