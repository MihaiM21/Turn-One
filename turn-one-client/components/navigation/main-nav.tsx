"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Menu, X, BarChart3 } from "lucide-react"
import { SOCIAL_LINKS } from "@/lib/social-links"

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
    { href: "/home", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/features", label: "Features" },
    { href: "/examples", label: "Examples" },
    // { href: "/games", label: "Games" },
    { href: "/api-launch", label: "API" },
    { href: "/news" , label: "News" },
    { href: "/pricing", label: "Pricing" },
    // { href: "/contact", label: "Contact" },
  ]

  if (variant === "homepage") {
    return (
      <nav
        className={`fixed left-1/2 -translate-x-1/2 z-50 ${
          isScrolled
            ? "top-4 w-[95%] max-w-6xl rounded-2xl bg-black/90 backdrop-blur-xl shadow-2xl border border-white/20"
            : "top-0 w-full bg-transparent border-b shadow-none"
        }`}
        style={{
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform, width, top, background-color, border-radius',
          backdropFilter: isScrolled ? 'blur(20px)' : 'blur(0px)',
          // Am scăzut intensitatea folosind o culoare cu opacitate (ex: color-mix sau rgba)
          borderImage: !isScrolled 
            ? "linear-gradient(to right, transparent, color-mix(in srgb, var(--foreground), transparent 70%), transparent) 1" 
            : "none"
        }}
      >
        <div className={`mx-auto ${
          isScrolled ? "px-8" : "container px-6"
        }`}
        style={{ 
          transition: 'padding 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div className={`flex items-center justify-between ${
            isScrolled ? "h-16 py-2" : "h-18 py-3"
          }`}
          style={{ 
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="mt-1 w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <img src="logo.png" alt="Logo Turn One"/>
                </div>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative text-foreground hover:text-primary transition-colors duration-200 px-4 py-2 rounded-lg"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {item.label}
                    {item.badge && (
                      <Badge className="text-xs px-1.5 py-0 h-5 bg-primary hover:bg-primary text-white border-none">
                        {item.badge}
                      </Badge>
                    )}
                  </span>
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Button
                asChild
                className="bg-primary hover:bg-primary/90 text-white"
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
              className="md:hidden text-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
          </div>

          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <div className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-foreground hover:text-primary transition-colors duration-200 px-4 py-3 rounded-lg hover:bg-primary/10 flex items-center justify-between"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <Badge className="text-xs px-2 py-0 h-5 bg-primary hover:bg-primary text-white border-none">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                ))}
                
                <div className="border-t border-border pt-4 mt-4">
                  <Button asChild variant="outline" className="w-full mb-3 border-primary/40 hover:border-primary hover:bg-primary/10">
                    <Link href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)}>
                      <img src="/discord.svg" alt="Discord" className="h-4 w-4 mr-2" />
                      Join Discord
                    </Link>
                  </Button>
                  <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white">
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
