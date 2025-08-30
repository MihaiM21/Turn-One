import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MainNav } from "@/components/navigation/main-nav"
import {
  BarChart3,
  Zap,
  Target,
  Clock,
  MapPin,
  Database,
  Cpu,
  Eye,
  Settings,
  Download,
  Shield,
  Smartphone,
  Globe,
} from "lucide-react"

export default function FeaturesPage() {
  const mainFeatures = [
    {
      icon: BarChart3,
      title: "Advanced Lap Time Analysis",
      description:
        "Deep dive into sector-by-sector performance with millisecond precision timing data and comparative analysis across multiple sessions.",
      benefits: ["Sector time breakdowns", "Performance trends", "Session comparisons", "Weather impact analysis"],
    },
    {
      icon: Zap,
      title: "Real-Time Telemetry Processing",
      description:
        "Process live telemetry data as it happens during practice, qualifying, and race sessions with instant visualization.",
      benefits: ["Live data streaming", "Instant notifications", "Real-time alerts", "Performance monitoring"],
    },
    {
      icon: Target,
      title: "Precision Speed Trace Analysis",
      description:
        "Analyze speed, throttle, brake, and steering inputs with track position mapping for complete performance insights.",
      benefits: ["Speed profiling", "Braking analysis", "Throttle mapping", "Cornering optimization"],
    },
    {
      icon: MapPin,
      title: "Interactive Track Mapping",
      description:
        "Visualize telemetry data overlaid on accurate track maps with turn-by-turn analysis and optimal racing lines.",
      benefits: ["3D track visualization", "Racing line analysis", "Corner profiling", "Sector mapping"],
    },
  ]

  const technicalFeatures = [
    {
      icon: Database,
      title: "Historical Data Archive",
      description: "Access comprehensive F1 data from 2020 onwards with advanced filtering and search capabilities.",
    },
    {
      icon: Cpu,
      title: "AI-Powered Insights",
      description: "Machine learning algorithms identify performance patterns and optimization opportunities.",
    },
    {
      icon: Eye,
      title: "Multi-Driver Comparison",
      description: "Compare unlimited drivers side-by-side with synchronized telemetry visualization.",
    },
    {
      icon: Settings,
      title: "Custom Analysis Tools",
      description: "Build custom analysis workflows with our flexible data processing engine.",
    },
    {
      icon: Download,
      title: "Advanced Export Options",
      description: "Export data in multiple formats including CSV, JSON, PDF reports, and API access.",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security with encrypted data transmission and secure cloud storage.",
    },
  ]

  const platformFeatures = [
    {
      icon: Smartphone,
      title: "Mobile Responsive",
      description: "Full functionality on all devices with optimized mobile interface for trackside analysis.",
    },
    {
      icon: Globe,
      title: "Global Data Coverage",
      description: "Complete coverage of all F1 circuits with support for additional motorsport series.",
    },
    {
      icon: Clock,
      title: "24/7 Data Updates",
      description: "Continuous data synchronization with official timing systems and live session updates.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Professional</span>
            <br />
            F1 Telemetry Suite
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Comprehensive telemetry analysis tools trusted by racing teams, broadcasters, and F1 enthusiasts worldwide.
            Unlock the secrets hidden in every millisecond of race data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="glow-effect">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 gradient-text">Core Analysis Features</h2>

          <div className="grid lg:grid-cols-2 gap-8">
            {mainFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Card key={index} className="card-hover">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base mb-4">{feature.description}</CardDescription>
                    <div className="grid grid-cols-2 gap-2">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <div key={benefitIndex} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm text-muted-foreground">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Technical Features Grid */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 gradient-text">Technical Capabilities</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {technicalFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Card key={index} className="card-hover text-center">
                  <CardHeader>
                    <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 gradient-text">Platform Features</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {platformFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div key={index} className="text-center">
                  <div className="mx-auto mb-6 p-4 rounded-full bg-primary/10 w-fit">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 gradient-text">Who Uses Turn One</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="card-hover">
              <CardHeader>
                <Badge className="w-fit mb-2">Racing Teams</Badge>
                <CardTitle>Professional Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  F1 teams use our platform for race strategy, driver coaching, and car development. Real-time analysis
                  helps optimize performance during practice and qualifying sessions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <Badge className="w-fit mb-2">Media & Broadcasting</Badge>
                <CardTitle>Broadcasters</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  TV networks and journalists rely on our insights for race commentary, analysis segments, and creating
                  engaging content that explains F1 performance to viewers.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <Badge className="w-fit mb-2">Enthusiasts</Badge>
                <CardTitle>F1 Fans</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Passionate fans use our tools to understand race dynamics, compare their favorite drivers, and gain
                  deeper insights into the technical aspects of Formula One.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 gradient-text">Trusted by the F1 Community</h2>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">50+</div>
              <div className="text-muted-foreground">Racing Teams</div>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">1M+</div>
              <div className="text-muted-foreground">Data Points Daily</div>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">24/7</div>
              <div className="text-muted-foreground">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Experience the <span className="gradient-text">Future</span> of F1 Analysis
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join the revolution in motorsport analytics. Start your free trial today and discover what professional F1
            analysis can reveal about racing performance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="glow-effect">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
