'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  BarChart2, 
  Activity, 
  LineChart, 
  BarChart, 
  TrendingUp
} from 'lucide-react';

export function F1LiveNavbar() {
  const pathname = usePathname();
  
  const navItems = [
    { 
      name: 'Live Data V1', 
      href: '/live', 
      icon: LineChart 
    },
    { 
      name: 'Live Data V2', 
      href: '/livev2', 
      icon: Activity 
    },
    // Add more items as needed
  ];
  
  return (
    <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex justify-between items-center border-b">
      <div className="flex items-center space-x-2 px-4 py-2">
        <h2 className="text-lg font-semibold flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          F1 Live Data
        </h2>
      </div>
      <nav className="flex items-center space-x-1 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link href={item.href} key={item.href}>
              <Button 
                variant={isActive ? "default" : "ghost"} 
                size="sm"
                className="flex items-center"
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}