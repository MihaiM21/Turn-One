import * as React from "react"
import { type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
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
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isItemActive(item.url);
            
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild size="sm" isActive={active}>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
