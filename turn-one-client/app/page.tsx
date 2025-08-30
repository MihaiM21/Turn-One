import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Zap, Users, Trophy, TrendingUp, Clock } from "lucide-react"
import { MainNav } from "@/components/navigation/main-nav"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-100 bg-background">
      <MainNav variant="homepage" />

      {/* Hero Section */}
      <section className="min-h-220 overflow-hidden modern-gradient pt-16">
        <div className="absolute inset-0 bg-[url('/turn-one-car/0009.png')] bg-cover bg-center opacity-60" />
        {/* <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 animate-pulse" /> */}
        {/* <div
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/3 to-transparent animate-pulse"
        /> */}
        <div className="relative container mx-auto px-4 py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* <Badge
              variant="secondary"
              className="mb-6 text-sm font-medium accent-glow animate-in fade-in-0 slide-in-from-top-4 duration-700"
            >
              Beyond the Race
            </Badge> */}
            <h1 className="mt-15 text-4xl md:text-6xl lg:text-7xl font-bold text-balance mb-6 animate-in fade-in-0 slide-in-from-bottom-6 duration-1000 delay-200">
              Turn One
              <span className="gradient-text block mt-2 pb-4">
                Formula One Intelligence
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground text-pretty mb-8 max-w-3xl mx-auto">
              Advanced telemetry analysis, real-time insights, and professional motorsport intelligence for F1
              enthusiasts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-1000">
              <Button
                size="lg"
                className="text-lg px-8 py-6 glow-effect hover:scale-105 transition-all duration-300"
                asChild
              >
                <Link href="/dashboard-example">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Start Analysis
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 bg-transparent accent-glow hover:scale-105 transition-all duration-300"
                asChild
              >
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 modern-gradient">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text animate-in fade-in-0 slide-in-from-top-4 duration-700">
              Professional F1 Analysis Tools
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty animate-in fade-in-0 slide-in-from-top-4 duration-700 delay-200">
              Everything you need to analyze Formula One performance data with precision and insight.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="card-hover animate-in fade-in-0 slide-in-from-bottom-4 duration-700 hover:scale-105 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 glow-effect group-hover:scale-110 transition-all">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Telemetry Analysis</CardTitle>
                <CardDescription>
                  Advanced data visualization and analysis of lap times, sector performance, and vehicle dynamics.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover animate-in fade-in-0 slide-in-from-bottom-4 duration-700 hover:scale-105 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 accent-glow group-hover:scale-110 transition-all">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Real-Time Insights</CardTitle>
                <CardDescription>
                  Live performance tracking and instant analysis during practice, qualifying, and race sessions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover animate-in fade-in-0 slide-in-from-bottom-4 duration-700 hover:scale-105 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 glow-effect group-hover:scale-110 transition-all">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>
                  Track driver and team performance evolution across seasons with comprehensive trend analysis.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover animate-in fade-in-0 slide-in-from-bottom-4 duration-700 hover:scale-105 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 accent-glow group-hover:scale-110 transition-all">
                  <Trophy className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Championship Analytics</CardTitle>
                <CardDescription>
                  Deep dive into championship battles with predictive modeling and scenario analysis.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover animate-in fade-in-0 slide-in-from-bottom-4 duration-700 hover:scale-105 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 glow-effect group-hover:scale-110 transition-all">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Historical Data</CardTitle>
                <CardDescription>
                  Access comprehensive historical F1 data spanning decades of racing for comparative analysis.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover animate-in fade-in-0 slide-in-from-bottom-4 duration-700 hover:scale-105 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 accent-glow group-hover:scale-110 transition-all">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>
                  Share insights and collaborate with team members using professional-grade analysis tools.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="animate-in fade-in-0 slide-in-from-left-6 duration-1000">
                <Badge variant="outline" className="mb-4 accent-glow">
                  About Turn One
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 gradient-text">
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
                  className="glow-effect bg-transparent hover:scale-105 transition-all duration-300"
                  asChild
                >
                  <Link href="/about">Discover Our Story</Link>
                </Button>
              </div>
              <div className="relative animate-in fade-in-0 slide-in-from-right-6 duration-1000 delay-300">
                <div className="aspect-square modern-gradient rounded-2xl flex items-center justify-center p-4 glow-effect hover:scale-105 transition-all duration-500">
                  <img
                    src="/formula-1-telemetry-data-dashboard-screens-modern-.png"
                    alt="Turn One telemetry dashboard interface"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-ring text-primary-foreground glow-effect">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto animate-in fade-in-0 slide-in-from-bottom-6 duration-1000">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">Ready to Elevate Your F1 Analysis?</h2>
            <p className="text-xl mb-8 opacity-90 text-pretty">
              Join the next generation of Formula One intelligence. Get access to professional telemetry analysis tools
              and real-time insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6 accent-glow hover:scale-105 transition-all duration-300"
                asChild
              >
                <Link href="/dashboard-example">Start Analysis</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent hover:scale-105 transition-all duration-300"
                asChild
              >
                <Link href="/features">View Features</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
