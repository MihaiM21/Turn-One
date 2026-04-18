'use client';

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Zap, Users, Trophy, TrendingUp, Clock, Rocket, ArrowRight, Code2, Calendar, BookOpen } from "lucide-react"
import { MainNav } from "@/components/navigation/main-nav"
import Link from "next/link"
import { ScrollAnimation } from "@/components/animation/scroll-animation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Loading } from "@/components/ui/loading"
import { SOCIAL_LINKS } from "@/lib/social-links"
import { CallToAction } from "@/components/call-to-action"

export default function HomePage() {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const backgroundImage = "/turn-one-car/2026-turn-one-car/Cockpit_Image_01.webp";

  // Handle image preloading
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const img = new window.Image();
      img.src = backgroundImage;
      img.onload = () => setIsImageLoaded(true);
    }
  }, [backgroundImage]);

  return (
    <div className="min-h-100 bg-background">
      {/* Show loading screen while images are loading */}
      {!isImageLoaded && (
        <Loading message="Loading assets..." />
      )}

      {/* Preload with Next.js Image component (hidden) */}
      <div className="hidden">
        <Image
          src={backgroundImage}
          width={1920}
          height={1080}
          priority
          alt="Formula One car"
          onLoad={() => setIsImageLoaded(true)}
        />
      </div>

      <MainNav variant="homepage" />

      {/* Hero Section */}
      <section className="min-h-230 overflow-hidden bg-black pt-16 relative flex flex-col">
        {/* Background image */}
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${isImageLoaded ? 'opacity-60' : 'opacity-0'}`}
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        {/* Layered gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/30" />

        <div className="relative container mx-auto px-4 py-32 lg:py-40 flex-1 flex items-center">
          <div className="max-w-5xl mx-auto text-center w-full">
            <ScrollAnimation direction="up" delay={0.1}>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-4 leading-none">
                TURN ONE
              </h1>
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="h-px flex-1 max-w-24 bg-gradient-to-r from-transparent to-primary/60" />
                <span className="gradient-text text-xl md:text-2xl lg:text-3xl font-semibold tracking-wide">
                  Formula One Intelligence
                </span>
                <div className="h-px flex-1 max-w-24 bg-gradient-to-l from-transparent to-primary/60" />
              </div>
            </ScrollAnimation>

            <ScrollAnimation direction="up" delay={0.2}>
              <p className="text-lg md:text-xl text-muted-foreground text-pretty mb-10 max-w-2xl mx-auto">
                Advanced telemetry analysis, real-time insights, and professional motorsport intelligence for F1
                enthusiasts.
              </p>
            </ScrollAnimation>

            <ScrollAnimation direction="up" delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 glow-effect group relative overflow-hidden"
                  asChild
                >
                  <Link href="/dashboard">
                    Start Analysis
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 accent-glow group relative overflow-hidden"
                  asChild
                >
                  <Link href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer">
                    <svg fill="white" role="img" viewBox="0 0 24 24" className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg"><title>Discord</title><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" /></svg>
                    Join Discord
                  </Link>
                </Button>
              </div>
            </ScrollAnimation>

            {/* Stats row */}
            <ScrollAnimation direction="up" delay={0.4}>
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 text-sm text-muted-foreground border-t border-border/40 pt-8 max-w-2xl mx-auto">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-bold text-foreground">5+</span>
                  <span>Years of F1 Data</span>
                </div>
                <div className="w-px h-8 bg-border/60 hidden sm:block" />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-bold text-foreground">Real-Time</span>
                  <span>Live Telemetry</span>
                </div>
                <div className="w-px h-8 bg-border/60 hidden sm:block" />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-bold text-foreground">1000+</span>
                  <span>Sessions Analyzed</span>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>

        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>
    
      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <ScrollAnimation direction="up">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
                Professional F1 Analysis Tools
              </h2>
            </ScrollAnimation>
            <ScrollAnimation direction="up" delay={0.2}>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                Everything you need to analyze Formula One performance data with precision and insight.
              </p>
            </ScrollAnimation>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <ScrollAnimation direction="up" delay={0.1}>
              <Card className="card-hover bg-card border-border">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Telemetry Analysis</CardTitle>
                  <CardDescription>
                    Advanced data visualization and analysis of lap times, sector performance, and vehicle dynamics.
                  </CardDescription>
                </CardHeader>
              </Card>
            </ScrollAnimation>

            <ScrollAnimation direction="up" delay={0.2}>
              <Card className="card-hover bg-card border-border">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Real-Time Insights</CardTitle>
                  <CardDescription>
                    Live performance tracking and instant analysis during practice, qualifying, and race sessions.
                  </CardDescription>
                </CardHeader>
              </Card>
            </ScrollAnimation>

            <ScrollAnimation direction="up" delay={0.3}>
              <Card className="card-hover bg-card border-border">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>
                    Track driver and team performance evolution across seasons with comprehensive trend analysis.
                  </CardDescription>
                </CardHeader>
              </Card>
            </ScrollAnimation>

            <ScrollAnimation direction="up" delay={0.4}>
              <Card className="card-hover bg-card border-border">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Championship Analytics</CardTitle>
                  <CardDescription>
                    Deep dive into championship battles with predictive modeling and scenario analysis.
                  </CardDescription>
                </CardHeader>
              </Card>
            </ScrollAnimation>

            <ScrollAnimation direction="up" delay={0.5}>
              <Card className="card-hover bg-card border-border">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Historical Data</CardTitle>
                  <CardDescription>
                    Access comprehensive historical F1 data spanning decades of racing for comparative analysis.
                  </CardDescription>
                </CardHeader>
              </Card>
            </ScrollAnimation>

            <ScrollAnimation direction="up" delay={0.6}>
              <Card className="card-hover bg-card border-border">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Team Collaboration</CardTitle>
                  <CardDescription>
                    Share insights and collaborate with team members using professional-grade analysis tools.
                  </CardDescription>
                </CardHeader>
              </Card>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <ScrollAnimation direction="left">
                <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                  About Turn One
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Motorsport Intelligence Specialists
                </h2>
                <p className="text-lg text-muted-foreground mb-6 text-pretty">
                  Turn One combines cutting-edge technology with deep Formula One expertise to deliver
                  professional-grade analysis tools for teams, drivers, and passionate F1 enthusiasts.
                </p>
                <p className="text-lg text-muted-foreground mb-8 text-pretty">
                  Our platform processes millions of data points from every session, transforming raw telemetry into
                  actionable insights that drive performance improvements and strategic decisions.
                </p>
                <Button
                  size="lg"
                  variant="outline"
                  className="accent-glow group"
                  asChild
                >
                  <Link href="/about">
                    Discover Our Story
                    <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </Button>
              </ScrollAnimation>
              <ScrollAnimation direction="right" delay={0.2}>
                <div className="aspect-square bg-card border border-border rounded-2xl flex items-center justify-center p-4">
                  <div className="relative w-full h-full">
                    <img
                      src="/sample-image.png"
                      alt="Turn One telemetry dashboard interface"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background text-primary-foreground">
        <CallToAction />
      </section>
    </div>
  )
}