"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Upload, Home, Zap, Bell, User } from "lucide-react"
import Link from "next/link"

export function DashboardHeader() {
  return (
    <header className="border-b border-primary/20 bg-background/95 backdrop-blur-md sticky top-0 z-40 animate-in slide-in-from-top-4 duration-500">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center glow-effect group-hover:scale-110 transition-all duration-300">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md group-hover:blur-lg transition-all duration-300"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-foreground font-bold text-xl gradient-text group-hover:scale-105 transition-transform duration-300">
                  Turn One
                </span>
                <span className="text-xs text-muted-foreground font-medium tracking-wider">F1 TELEMETRY</span>
              </div>
            </Link>

            <div className="flex items-center space-x-3">
              <div className="h-8 w-px bg-border"></div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <Badge variant="secondary" className="accent-glow animate-pulse">
                  Live
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              className="border-primary/30 text-foreground hover:bg-primary/10 hover:border-primary/50 bg-transparent hover:scale-105 transition-all duration-300"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Data
            </Button>

            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:scale-105 transition-all duration-300"
              >
                <Bell className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:scale-105 transition-all duration-300"
              >
                <Link href="/">
                  <Home className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:scale-105 transition-all duration-300"
              >
                <Settings className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:scale-105 transition-all duration-300"
              >
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
