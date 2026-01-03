"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-red-600 to-red-500 text-white py-2.5 px-4">
      <div className="container mx-auto flex items-center justify-center gap-2 text-sm md:text-base">
        <Rocket className="w-4 h-4 flex-shrink-0" />
        <p className="font-medium text-center">
          <span className="hidden sm:inline">🏎️ T1 API launching Q2 2026! </span>
          <Link 
            href="/api-launch" 
            className="underline underline-offset-4 hover:text-white/80 transition-colors font-semibold"
          >
            Join the wishlist →
          </Link>
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-white hover:bg-white/20 hover:text-white"
          onClick={() => setIsVisible(false)}
          aria-label="Close announcement"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
