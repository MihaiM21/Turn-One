'use client';

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Zap, Users, Trophy, TrendingUp, Clock, Rocket, ArrowRight, Code2, Calendar, BookOpen } from "lucide-react"
import { MainNav } from "@/components/navigation/main-nav"
import Link from "next/link"
import { ScrollAnimation } from "@/components/animation/scroll-animation"
import { NumberOneOutline } from "@/components/animation/hero-particles"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Loading } from "@/components/ui/loading"
import { getArticles, type Article } from '@/lib/articleService'

interface FeaturedArticle {
  slug: string
  title: string
  excerpt: string
  category: string
  publishDate: string
  featured?: boolean
}

export default function HomePage() {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [featuredArticle, setFeaturedArticle] = useState<FeaturedArticle | null>(null);
  const backgroundImage = "/turn-one-car/2026-turn-one-car/0001.webp";

  // Handle image preloading
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const img = new window.Image();
      img.src = backgroundImage;
      img.onload = () => setIsImageLoaded(true);
    }
  }, [backgroundImage]);

  // Load featured article
  useEffect(() => {
    const loadFeaturedArticle = async () => {
      // Try to get featured article from API
      const articles = await getArticles({ featured: true, limit: 1 })
      
      if (articles.length > 0) {
        setFeaturedArticle(articles[0])
      } else {
        // Fallback to default if no featured articles
        const defaultArticle: FeaturedArticle = {
          slug: 'f1-2026-season-preview',
          title: 'F1 2026 Season Preview: Complete Guide to Formula 1 Championship',
          excerpt: 'Everything you need to know about the F1 2026 season: new regulations, driver lineups, team changes, race calendar, and championship predictions.',
          category: 'Season Preview',
          publishDate: '2026-01-31',
          featured: true,
        }
        setFeaturedArticle(defaultArticle)
      }
    }
    loadFeaturedArticle()
  }, []);

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
      <section className="min-h-230 overflow-hidden bg-black pt-16 relative">
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${isImageLoaded ? 'opacity-80' : 'opacity-0'}`}
          style={{ backgroundImage: `url(${backgroundImage})` }}

        />
        {/* <NumberOneOutline /> */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
        <div className="relative container mx-auto px-4 py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* <Badge
              variant="secondary"
              className="mb-6 text-sm font-medium accent-glow"
            >
              Beyond the Race
            </Badge> */}
            <ScrollAnimation direction="up">
              <h1 className="mt-15 text-4xl md:text-6xl lg:text-7xl font-bold text-balance mb-6">
                TURN ONE
                <span className="gradient-text block mt-2 pb-4">
                  Formula One Intelligence
                </span>
              </h1>
            </ScrollAnimation>
            <ScrollAnimation direction="up" delay={0.2}>
              <p className="text-xl md:text-2xl text-muted-foreground text-pretty mb-8 max-w-3xl mx-auto">
                Advanced telemetry analysis, real-time insights, and professional motorsport intelligence for F1
                enthusiasts.
              </p>
            </ScrollAnimation>
            <ScrollAnimation direction="up" delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 glow-effect group relative overflow-hidden"
                  asChild
                >
                  <Link href="/dashboard">
                    <BarChart3 className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                    Start Analysis
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 accent-glow group relative overflow-hidden"
                  asChild
                >
                  <Link href="/features">
                    Explore Features
                    <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </Button>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Featured Article Section */}
      {featuredArticle && (
        <section className="py-16 bg-background border-b border-border">
          <div className="container mx-auto px-4">
            <ScrollAnimation direction="up">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-2 mb-8">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold">Latest from the Blog</h2>
                </div>
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-primary/20">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative aspect-video md:aspect-auto min-h-[300px]">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                      <Image
                        src="/turn-one-car/2026-turn-one-car/0001.webp"
                        alt={featuredArticle.title}
                        fill
                        className="object-cover"
                      />
                      <Badge className="absolute top-4 left-4 bg-red-600 text-white">
                        {featuredArticle.category}
                      </Badge>
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                      <h3 className="text-2xl md:text-3xl font-bold mb-4">
                        {featuredArticle.title}
                      </h3>
                      <p className="text-muted-foreground mb-6 text-lg">
                        {featuredArticle.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(featuredArticle.publishDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                      <Button asChild className="w-fit glow-effect">
                        <Link href={`/blog/${featuredArticle.slug}`}>
                          Read Full Article
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </ScrollAnimation>
          </div>
        </section>
      )}

      {/* API Launch Announcement - Prominent Section */}
      <section className="py-16 bg-background border-y border-border">
        <div className="container mx-auto px-4">
          <ScrollAnimation direction="up">
            <div className="max-w-5xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">
                    <Rocket className="w-3 h-3 mr-1" />
                    Coming Q2 2026
                  </Badge>
                  <h2 className="text-3xl md:text-5xl font-bold mb-4">
                    T1 API
                    <span className="block gradient-text mt-2">Public Launch</span>
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    Access the power of Turn One through our comprehensive API. Real-time F1 data,
                    historical statistics, live timing, and more - all at your fingertips.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      size="lg"
                      className="glow-effect group relative overflow-hidden"
                      asChild
                    >
                      <Link href="/api-launch">
                        Join Wishlist
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="accent-glow group"
                      asChild
                    >
                      <Link href="https://docs.t1f1.com" target="_blank" rel="noopener noreferrer">
                        <Code2 className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                        Learn More
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <div className="bg-card border border-border rounded-xl p-8">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Real-Time Data</h4>
                          <p className="text-sm text-muted-foreground">Live timing and telemetry during race weekends</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Historical Archives</h4>
                          <p className="text-sm text-muted-foreground">Complete F1 data spanning decades</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Code2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Developer Friendly</h4>
                          <p className="text-sm text-muted-foreground">RESTful API with WebSocket support</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
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
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <ScrollAnimation direction="up">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">Ready to Elevate Your F1 Analysis?</h2>
              <p className="text-xl mb-8 opacity-90 text-pretty">
                Join the next generation of Formula One intelligence. Get access to professional telemetry analysis tools
                and real-time insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-lg h-14 px-8 bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl group"
                  asChild
                >
                  <Link href="/dashboard">
                    <BarChart3 className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                    Start Analysis
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-lg h-14 px-8 bg-white text-primary hover:bg-white hover:text-primary transition-all duration-300 hover:scale-105 group"
                  asChild
                >
                  <Link href="/features">
                    View Features
                    <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </Button>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>
    </div>
  )
}