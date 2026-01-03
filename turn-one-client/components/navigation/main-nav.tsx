"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Menu, X, BarChart3, Zap, Rocket } from "lucide-react"

interface MainNavProps {
  variant?: "homepage" | "dashboard"
}

export function MainNav({ variant = "homepage" }: MainNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems: Array<{ href: string; label: string; badge?: string }> = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/features", label: "Features" },
    { href: "/api-launch", label: "API", badge: "New" },
    { href: "/news" , label: "News" },
    { href: "/pricing", label: "Pricing" },
    { href: "/contact", label: "Contact" },
  ]

  if (variant === "homepage") {
    return (
      <nav
        className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-700 ${
          isScrolled
            ? "top-4 w-[95%] max-w-5xl rounded-xl bg-background/60 backdrop-blur-lg border border-primary/20 shadow-xl shadow-primary/5"
            : "top-0 w-full bg-transparent"
        }`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
          willChange: isScrolled ? 'transform, width, border-radius' : 'auto'
        }}
      >
        <div className={`mx-auto transition-all duration-700 ${
          isScrolled ? "px-8" : "container px-6"
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}>
          <div className={`flex items-center justify-between transition-all duration-700 ${
            isScrolled ? "h-16 py-2" : "h-18 py-3"
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}>
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="mt-1 w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <img src="logo.png" alt="Logo Turn One"/>
                </div>
              </div>
              {/* <div className="flex flex-col">
                <span className="text-foreground font-bold text-xl gradient-text">
                  Turn One
                </span>
                <span className="text-xs text-muted-foreground font-medium tracking-wider">PERFORMANCE</span>
              </div> */}
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative text-foreground hover:text-foreground transition-all duration-300 px-4 py-2 rounded-lg group overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {item.label}
                    {item.badge && (
                      <Badge className="text-xs px-1.5 py-0 h-5 bg-red-500 hover:bg-red-500 text-white border-none">
                        {item.badge}
                      </Badge>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-primary/10 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-lg"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Button
                asChild
                className="bg-primary hover:bg-primary/90 text-primary-foreground glow-effect hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <Link href="/dashboard">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              
            </div>
            

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all duration-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
          </div>

          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-border animate-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col space-y-2">
                {navItems.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-all duration-300 px-4 py-3 rounded-lg hover:bg-primary/10 animate-in slide-in-from-left-1 duration-300 flex items-center justify-between"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <Badge className="text-xs px-2 py-0 h-5 bg-red-500 hover:bg-red-500 text-white border-none">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                ))}
                
                <div className="border-t border-border pt-4 mt-4">
                  <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-effect">
                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </Button>
                  
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    )
  }

  return null
}
