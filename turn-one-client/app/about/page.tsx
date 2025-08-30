import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MainNav } from "@/components/navigation/main-nav"
import { Trophy, Users, Target, Zap, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden modern-gradient pt-24 pb-16">
        <div className="absolute inset-0 bg-[url('/turn-one-car/0005.png')] bg-cover bg-center opacity-40" />
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 text-sm font-medium accent-glow">
              About Turn One
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">
              <span className="gradient-text">Motorsport Intelligence</span>
              <span className="block mt-2">Specialists</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground text-pretty mb-8 max-w-3xl mx-auto">
              Pioneering the future of Formula One analysis through cutting-edge technology and deep motorsport
              expertise.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 gradient-text">Our Mission</h2>
                <p className="text-lg text-muted-foreground mb-6 text-pretty">
                  At Turn One, we believe that data is the key to unlocking peak performance in Formula One. Our mission
                  is to democratize access to professional-grade telemetry analysis, making advanced motorsport
                  intelligence available to teams, drivers, and passionate F1 enthusiasts worldwide.
                </p>
                <p className="text-lg text-muted-foreground mb-8 text-pretty">
                  We transform millions of data points from every session into actionable insights that drive
                  performance improvements, strategic decisions, and deeper understanding of the sport we all love.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Badge variant="outline" className="accent-glow">
                    Data-Driven
                  </Badge>
                  <Badge variant="outline" className="glow-effect">
                    Professional Grade
                  </Badge>
                  <Badge variant="outline" className="accent-glow">
                    Innovation First
                  </Badge>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square modern-gradient rounded-2xl p-8 glow-effect">
                  <div className="grid grid-cols-2 gap-4 h-full">
                    <div className="bg-primary/10 rounded-xl flex items-center justify-center card-hover">
                      <BarChart3 className="h-12 w-12 text-primary" />
                    </div>
                    <div className="bg-accent/10 rounded-xl flex items-center justify-center card-hover">
                      <Zap className="h-12 w-12 text-accent" />
                    </div>
                    <div className="bg-accent/10 rounded-xl flex items-center justify-center card-hover">
                      <Trophy className="h-12 w-12 text-accent" />
                    </div>
                    <div className="bg-primary/10 rounded-xl flex items-center justify-center card-hover">
                      <Target className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 modern-gradient">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Our Journey</h2>
            <p className="text-xl text-muted-foreground text-pretty">
              From F1 enthusiasts to industry leaders in motorsport intelligence.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <Card className="card-hover">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center glow-effect">
                    <span className="text-primary font-bold text-lg">2023</span>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">The Beginning</CardTitle>
                    <CardDescription className="text-base">
                      Founded by a team of F1 data analysts and software engineers who saw the need for better telemetry
                      analysis tools in the motorsport community.
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>

              <Card className="card-hover">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center accent-glow">
                    <span className="text-accent font-bold text-lg">2024</span>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">First Platform Launch</CardTitle>
                    <CardDescription className="text-base">
                      Released our first telemetry analysis platform, serving over 1,000 F1 enthusiasts with real-time
                      race data and performance insights.
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>

              <Card className="card-hover">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center glow-effect">
                    <span className="text-primary font-bold text-lg">2025</span>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">AI Integration</CardTitle>
                    <CardDescription className="text-base">
                      Integrated machine learning algorithms for predictive analysis and automated performance
                      optimization recommendations.
                      Expanded to serve motorsport communities worldwide, processing over 10 million data points per
                      race weekend.
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>

            

              <Card className="card-hover border-primary/40">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center glow-effect">
                    <span className="gradient-text font-bold text-lg">2026</span>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 gradient-text">Next Generation Platform</CardTitle>
                    <CardDescription className="text-base">
                      Launching our most advanced platform yet, featuring real-time telemetry streaming, advanced AI
                      insights, and collaborative team tools.
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Our Values</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                The principles that drive everything we do at Turn One.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="card-hover">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 glow-effect">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Precision</CardTitle>
                  <CardDescription>
                    Every millisecond matters in F1. We deliver analysis with the precision that champions demand.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="card-hover">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 accent-glow">
                    <Zap className="h-8 w-8 text-accent" />
                  </div>
                  <CardTitle>Innovation</CardTitle>
                  <CardDescription>
                    Constantly pushing the boundaries of what's possible in motorsport data analysis and visualization.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="card-hover">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 glow-effect">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Community</CardTitle>
                  <CardDescription>
                    Building tools that bring the F1 community together through shared passion for data and performance.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-ring text-primary-foreground glow-effect">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">Join Our Journey</h2>
            <p className="text-xl mb-8 opacity-90 text-pretty">
              Be part of the next chapter in Formula One intelligence. Experience the future of motorsport analysis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6 accent-glow" asChild>
                <Link href="/dashboard">Start Your Analysis</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
                asChild
              >
                <Link href="/dashboard-example">Explore Platform</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
