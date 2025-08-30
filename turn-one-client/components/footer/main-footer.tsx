import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart3, Mail, Phone, MapPin, Twitter, Linkedin, Github, Zap } from "lucide-react"

export function MainFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-background border-t border-border">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <img src="logo.png" alt="Logo Turn One" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-foreground font-bold text-xl gradient-text">Turn One</span>
                <span className="text-xs text-muted-foreground font-medium tracking-wider">F1 TELEMETRY</span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Professional Formula One telemetry analysis and real-time insights for motorsport enthusiasts and
              professionals.
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary transition-colors">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary transition-colors">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary transition-colors">
                <Github className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-foreground font-semibold text-lg">Quick Links</h3>
            <div className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/about", label: "About Us" },
                { href: "/features", label: "Features" },
                { href: "/pricing", label: "Pricing" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-muted-foreground hover:text-primary transition-colors text-sm py-1"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-foreground font-semibold text-lg">Services</h3>
            <div className="space-y-2">
              {[
                { href: "/services", label: "Telemetry Analysis" },
                { href: "/dashboard", label: "Live Dashboard" },
                { href: "/team", label: "Expert Team" },
                { href: "/contact", label: "Contact Us" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-muted-foreground hover:text-primary transition-colors text-sm py-1"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-foreground font-semibold text-lg">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">contact@t1f1.com</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Monaco, Monte Carlo</span>
              </div>
            </div>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-effect">
              <Link href="/dashboard">
                <BarChart3 className="h-4 w-4 mr-2" />
                Start Analysis
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">© {currentYear} Turn One. All rights reserved.</div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-muted-foreground hover:text-primary transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
