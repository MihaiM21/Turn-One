'use client';

import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950 to-black flex flex-col items-center justify-center p-6 text-white">
      <div className="max-w-md text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-red-500">Under Construction</h1>
          <h2 className="text-3xl font-semibold">Page is currently being worked on</h2>
          <p className="text-lg text-gray-300">
            Sorry, this page is not yet available. Please check back later.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Button 
            variant="outline" 
            className="border-red-600 text-red-400 hover:bg-red-900/20"
            asChild
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            className="text-gray-300 hover:text-white hover:bg-gray-800/50"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}