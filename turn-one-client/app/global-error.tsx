'use client';

import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Button } from "@/components/ui/button";
import { RefreshCcw, Home } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <div className="min-h-screen bg-gradient-to-br from-black via-red-950 to-black flex flex-col items-center justify-center p-6 text-white">
          <div className="max-w-md text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-6xl font-bold text-red-500">500</h1>
              <h2 className="text-3xl font-semibold">Critical Server Error</h2>
              <p className="text-lg text-gray-300">
                A critical error occurred. Please try again.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button 
                variant="outline" 
                className="border-red-600 text-red-400 hover:bg-red-900/20"
                onClick={() => reset()}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              
              <Button 
                variant="ghost" 
                className="text-gray-300 hover:text-white hover:bg-gray-800/50"
                asChild
              >
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Return Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
