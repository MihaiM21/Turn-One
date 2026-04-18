import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MainNav } from "@/components/navigation/main-nav"
import { Trophy, Users, Target, Zap, BarChart3 } from "lucide-react"
import Link from "next/link"
import { ScrollAnimation } from "@/components/animation/scroll-animation"
import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'
import { CallToAction } from "@/components/call-to-action"


export const metadata: Metadata = generateSEO({
  title: 'About Turn One',
  description: 'Learn about Turn One - the premier Formula 1 live timing and telemetry platform. Discover our mission to revolutionize F1 data analysis and motorsport intelligence.',
  url: '/about',
  keywords: [
    'about Turn One',
    'F1 analysis platform',
    'motorsport intelligence',
    'F1 data specialists',
    'telemetry experts',
  ],
})

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black pt-30 pb-16">
        <div className="absolute inset-0 bg-[url('/turn-one-car/2026-turn-one-car/0002.webp')] bg-cover bg-center opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollAnimation direction="up">
              <Badge variant="outline" className="mb-6 text-sm font-medium border-primary/50 text-primary">
                About Turn One
              </Badge>
            </ScrollAnimation>
            <ScrollAnimation direction="up" delay={0.2}>
              <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">
                <span className="text-primary">Motorsport Intelligence</span>
                <span className="block mt-2">Specialists</span>
              </h1>
            </ScrollAnimation>
            <ScrollAnimation direction="up" delay={0.4}>
              <p className="text-xl md:text-2xl text-muted-foreground text-pretty mb-8 max-w-3xl mx-auto">
                Pioneering the future of Formula One analysis through cutting-edge technology and deep motorsport
                expertise.
              </p>
            </ScrollAnimation>

          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <ScrollAnimation direction="right" delay={0.2}>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">Our Mission</h2>
                </ScrollAnimation>
                <ScrollAnimation direction="right" delay={0.3}>
                  <p className="text-lg text-muted-foreground mb-6 text-pretty">
                    At Turn One, we believe that data is the key to unlocking peak performance in Formula One. Our mission
                    is to democratize access to professional-grade telemetry analysis, making advanced motorsport
                    intelligence available to teams, drivers, and passionate F1 enthusiasts worldwide.
                  </p>
                </ScrollAnimation>
                <ScrollAnimation direction="right" delay={0.4}>
                  <p className="text-lg text-muted-foreground mb-8 text-pretty">
                    We transform millions of data points from every session into actionable insights that drive
                    performance improvements, strategic decisions, and deeper understanding of the sport we all love.
                  </p>
                </ScrollAnimation>
                <div className="flex flex-wrap gap-4">
                  <Badge variant="outline" className="border-primary/50 text-primary">
                    Data-Driven
                  </Badge>
                  <Badge variant="outline" className="border-primary/50 text-primary">
                    Professional Grade
                  </Badge>
                  <Badge variant="outline" className="border-primary/50 text-primary">
                    Innovation First
                  </Badge>
                </div>
              </div>
              <ScrollAnimation direction="left" delay={0.6}>
                <div className="relative">
                  <div className="aspect-square bg-card border border-border rounded-2xl p-8">
                    <div className="grid grid-cols-2 gap-4 h-full">
                      <div className="bg-primary/20 rounded-xl flex items-center justify-center card-hover">
                        <BarChart3 className="h-12 w-12 text-primary" />
                      </div>
                      <div className="bg-primary/20 rounded-xl flex items-center justify-center card-hover">
                        <Zap className="h-12 w-12 text-primary" />
                      </div>
                      <div className="bg-primary/20 rounded-xl flex items-center justify-center card-hover">
                        <Trophy className="h-12 w-12 text-primary" />
                      </div>
                      <div className="bg-primary/20 rounded-xl flex items-center justify-center card-hover">
                        <Target className="h-12 w-12 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <ScrollAnimation direction="up">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">Our Journey</h2>
            </ScrollAnimation>
            <ScrollAnimation direction="up" delay={0.2}>
              <p className="text-xl text-muted-foreground text-pretty">
                From F1 enthusiasts to industry leaders in motorsport intelligence.
              </p>
            </ScrollAnimation>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <ScrollAnimation direction="right" >
                <Card className="card-hover bg-background border-border">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center transition-transform hover:scale-110">
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
              </ScrollAnimation>

              <ScrollAnimation direction="right" >
                <Card className="card-hover bg-background border-border">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center transition-transform hover:scale-110">
                      <span className="text-primary font-bold text-lg">2024</span>
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
              </ScrollAnimation>

              <ScrollAnimation direction="right" >
                <Card className="card-hover bg-background border-border">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center transition-transform hover:scale-110">
                      <span className="text-primary font-bold text-lg">2025</span>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">AI Integration</CardTitle>
                      <CardDescription className="text-base">
                        Integrated machine learning algorithms for predictive analysis and automated performance
                        optimization recommendations.
                        Processing over 10 million data points per
                        race weekend.
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </ScrollAnimation>

              <ScrollAnimation direction="right">
                <Card className="card-hover bg-background border-primary/50 shadow-[0_0_20px_rgba(225,29,72,0.2)]">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl flex items-center justify-center transition-transform hover:scale-110">
                      <span className="text-primary font-bold text-lg">2026</span>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2 text-primary">Next Generation Platform</CardTitle>
                      <CardDescription className="text-base">
                        Launching our most advanced platform yet, featuring real-time telemetry streaming, advanced AI
                        insights, and collaborative team tools.
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </ScrollAnimation>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <ScrollAnimation direction="up">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">Our Values</h2>
              </ScrollAnimation>
              <ScrollAnimation direction="up" delay={0.2}>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                  The principles that drive everything we do at Turn One.
                </p>
              </ScrollAnimation>

            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <ScrollAnimation direction="up">
                <Card className="card-hover bg-card border-border group">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(225,29,72,0.2)]">
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">Precision</CardTitle>
                    <CardDescription>
                      Every millisecond matters in F1. We deliver analysis with the precision that champions demand.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </ScrollAnimation>

              <ScrollAnimation direction="up" delay={0.2}>
                <Card className="card-hover bg-card border-border group">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(225,29,72,0.2)]">
                      <Zap className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">Innovation</CardTitle>
                    <CardDescription>
                      Constantly pushing the boundaries of what&apos;s possible in motorsport data analysis and visualization.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </ScrollAnimation>

              <ScrollAnimation direction="up" delay={0.4}>
                <Card className="card-hover bg-card border-border group">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(225,29,72,0.2)]">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>Community</CardTitle>
                    <CardDescription>
                      Building tools that bring the F1 community together through shared passion for data and performance.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </ScrollAnimation>

            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background text-white">
        <CallToAction />
      </section>
    </div>
  )
}
