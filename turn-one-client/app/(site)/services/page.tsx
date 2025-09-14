import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MainNav } from "@/components/navigation/main-nav"
import { BarChart3, Zap, TrendingUp, Trophy, Users, Activity, Database, Gauge, MapPin, Settings } from "lucide-react"
import Link from "next/link"

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden modern-gradient pt-24 pb-16">
        <div className="absolute inset-0 bg-[url('/turn-one-car/0005.png')] bg-cover bg-center opacity-10" />
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 text-sm font-medium accent-glow">
              Professional F1 Services
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">
              <span className="gradient-text">Advanced Telemetry</span>
              <span className="block mt-2">Analysis Services</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground text-pretty mb-8 max-w-3xl mx-auto">
              Comprehensive Formula One intelligence solutions for teams, drivers, and passionate motorsport
              enthusiasts.
            </p>
          </div>
        </div>
      </section>

      {/* Core Services */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Core Services</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                Professional-grade analysis tools designed for peak performance insights.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="card-hover">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4 glow-effect">
                    <BarChart3 className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-3">Telemetry Analysis</CardTitle>
                  <CardDescription className="text-base">
                    Advanced data visualization and analysis of lap times, sector performance, and vehicle dynamics with
                    millisecond precision.
                  </CardDescription>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="outline" className="text-xs">
                      Lap Times
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Sector Analysis
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Speed Traces
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center mb-4 accent-glow">
                    <Zap className="h-8 w-8 text-accent" />
                  </div>
                  <CardTitle className="text-xl mb-3">Real-Time Insights</CardTitle>
                  <CardDescription className="text-base">
                    Live performance tracking and instant analysis during practice, qualifying, and race sessions with
                    real-time data streaming.
                  </CardDescription>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="outline" className="text-xs">
                      Live Timing
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Session Analysis
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Instant Alerts
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4 glow-effect">
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-3">Performance Trends</CardTitle>
                  <CardDescription className="text-base">
                    Track driver and team performance evolution across seasons with comprehensive trend analysis and
                    predictive modeling.
                  </CardDescription>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="outline" className="text-xs">
                      Season Analysis
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Predictions
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Comparisons
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center mb-4 accent-glow">
                    <Trophy className="h-8 w-8 text-accent" />
                  </div>
                  <CardTitle className="text-xl mb-3">Championship Analytics</CardTitle>
                  <CardDescription className="text-base">
                    Deep dive into championship battles with scenario analysis, points predictions, and strategic
                    recommendations.
                  </CardDescription>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="outline" className="text-xs">
                      Points Analysis
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Scenarios
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Strategy
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4 glow-effect">
                    <Database className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-3">Historical Data</CardTitle>
                  <CardDescription className="text-base">
                    Access comprehensive historical F1 data spanning decades of racing for comparative analysis and
                    research purposes.
                  </CardDescription>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="outline" className="text-xs">
                      Archive Access
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Data Export
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Research Tools
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center mb-4 accent-glow">
                    <Users className="h-8 w-8 text-accent" />
                  </div>
                  <CardTitle className="text-xl mb-3">Team Collaboration</CardTitle>
                  <CardDescription className="text-base">
                    Share insights and collaborate with team members using professional-grade analysis tools and secure
                    data sharing.
                  </CardDescription>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="outline" className="text-xs">
                      Team Sharing
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Secure Access
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Collaboration
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-24 modern-gradient">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Advanced Features</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                Cutting-edge tools for professional motorsport analysis and optimization.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="card-hover">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center glow-effect">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Track Mapping</CardTitle>
                  </div>
                  <CardDescription className="text-base mb-4">
                    Interactive track maps with real-time positioning, sector analysis, and corner-by-corner performance
                    breakdowns for every circuit on the F1 calendar.
                  </CardDescription>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      Interactive Maps
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Corner Analysis
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Circuit Data
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center accent-glow">
                      <Activity className="h-6 w-6 text-accent" />
                    </div>
                    <CardTitle className="text-xl">Performance Optimization</CardTitle>
                  </div>
                  <CardDescription className="text-base mb-4">
                    AI-powered recommendations for setup optimization, driving line improvements, and strategic
                    decision-making based on comprehensive data analysis.
                  </CardDescription>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      AI Insights
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Setup Optimization
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Strategy
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center glow-effect">
                      <Gauge className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Custom Dashboards</CardTitle>
                  </div>
                  <CardDescription className="text-base mb-4">
                    Personalized analytics dashboards with customizable widgets, real-time data feeds, and tailored
                    insights for your specific analysis needs.
                  </CardDescription>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      Custom Widgets
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Real-time Data
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Personalized
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center accent-glow">
                      <Settings className="h-6 w-6 text-accent" />
                    </div>
                    <CardTitle className="text-xl">API Integration</CardTitle>
                  </div>
                  <CardDescription className="text-base mb-4">
                    Seamless integration with existing systems through our comprehensive API, enabling custom
                    applications and automated data workflows.
                  </CardDescription>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      REST API
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Webhooks
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Custom Integration
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Service Tiers */}
      {/* <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Service Tiers</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                Choose the perfect plan for your F1 analysis needs.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="card-hover">
                <CardHeader className="text-center">
                  <Badge variant="outline" className="mb-4 w-fit mx-auto">
                    Enthusiast
                  </Badge>
                  <CardTitle className="text-2xl mb-2">Essential</CardTitle>
                  <CardDescription className="text-base mb-6">
                    Perfect for F1 fans who want professional-grade analysis tools and insights.
                  </CardDescription>
                  <div className="space-y-3 text-sm text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>Basic telemetry analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>Real-time race insights</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>Historical data access</span>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="card-hover border-primary/40">
                <CardHeader className="text-center">
                  <Badge className="mb-4 w-fit mx-auto glow-effect">Professional</Badge>
                  <CardTitle className="text-2xl mb-2 gradient-text">Advanced</CardTitle>
                  <CardDescription className="text-base mb-6">
                    Comprehensive tools for teams, drivers, and serious motorsport professionals.
                  </CardDescription>
                  <div className="space-y-3 text-sm text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>Advanced telemetry analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>AI-powered optimization</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>Team collaboration tools</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>Custom dashboards</span>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="card-hover">
                <CardHeader className="text-center">
                  <Badge variant="outline" className="mb-4 w-fit mx-auto accent-glow">
                    Enterprise
                  </Badge>
                  <CardTitle className="text-2xl mb-2">Elite</CardTitle>
                  <CardDescription className="text-base mb-6">
                    Full-scale solutions for racing teams and motorsport organizations.
                  </CardDescription>
                  <div className="space-y-3 text-sm text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <span>Complete platform access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <span>API integration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <span>Dedicated support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <span>Custom development</span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-24 bg-ring text-primary-foreground glow-effect">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">Ready to Transform Your F1 Analysis?</h2>
            <p className="text-xl mb-8 opacity-90 text-pretty">
              Experience the power of professional-grade telemetry analysis. Start your journey with Turn One today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6 accent-glow" asChild>
                <Link href="/dashboard">Start Free Trial</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
                asChild
              >
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
