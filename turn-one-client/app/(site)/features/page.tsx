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
import Link from "next/link"
import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO({
  title: 'Features',
  description: 'Explore Turn One features - Advanced F1 lap time analysis, real-time telemetry processing, speed trace analysis, interactive track mapping, and comprehensive race data.',
  url: '/features',
  keywords: [
    'F1 features',
    'telemetry analysis',
    'lap time analysis',
    'track mapping',
    'real-time F1 data',
    'speed trace analysis',
  ],
})

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
            <span className="text-primary">Professional</span>
            <br />
            F1 Telemetry Suite
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Comprehensive telemetry analysis tools trusted by racing teams, broadcasters, and F1 enthusiasts worldwide.
            Unlock the secrets hidden in every millisecond of race data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="glow-effect">
              <Link href="/dashboard">Start Free Trial</Link>
            </Button>
            {/* <Button size="lg" variant="outline">
              <Link href="/demo">View Demo</Link>
            </Button> */}
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary">Core Analysis Features</h2>

          <div className="grid lg:grid-cols-2 gap-8">
            {mainFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Card key={index} className="card-hover bg-card border-border group">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(225,29,72,0.2)]">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base mb-6">{feature.description}</CardDescription>
                    <div className="grid grid-cols-2 gap-3">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <div key={benefitIndex} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
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
      <section className="py-16 px-4 bg-card">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary">Technical Capabilities</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {technicalFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Card key={index} className="card-hover text-center bg-background border-border group">
                  <CardHeader>
                    <div className="mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 w-fit transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(225,29,72,0.2)]">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{feature.title}</CardTitle>
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
          <h2 className="text-3xl font-bold text-center mb-12 text-primary">Platform Features</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {platformFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div key={index} className="text-center group">
                  <div className="mx-auto mb-6 p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 w-fit transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(225,29,72,0.25)]">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary">Who Uses Turn One</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="card-hover bg-background border-border group">
              <CardHeader>
                <Badge className="w-fit mb-2 bg-primary/20 text-primary border-primary/40 hover:bg-primary/30 transition-colors">Racing Teams</Badge>
                <CardTitle className="group-hover:text-primary transition-colors">Professionals</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Professionals use our platform for race strategy, and car development. Real-time analysis
                  helps them understand practice and qualifying sessions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="card-hover bg-background border-border group">
              <CardHeader>
                <Badge className="w-fit mb-2 bg-primary/20 text-primary border-primary/40 hover:bg-primary/30 transition-colors">Media & Broadcasting</Badge>
                <CardTitle className="group-hover:text-primary transition-colors">Broadcasters</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  TV networks and journalists rely on our insights for race commentary, analysis segments, and creating
                  engaging content that explains F1 performance to viewers.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="card-hover bg-background border-border group">
              <CardHeader>
                <Badge className="w-fit mb-2 bg-primary/20 text-primary border-primary/40 hover:bg-primary/30 transition-colors">Enthusiasts</Badge>
                <CardTitle className="group-hover:text-primary transition-colors">F1 Fans</CardTitle>
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
          <h2 className="text-3xl font-bold text-center mb-12 text-primary">Trusted by the F1 Community</h2>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-muted-foreground">Content Creators</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1M+</div>
              <div className="text-muted-foreground">Data Points Daily</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Experience the <span className="text-primary">Future</span> of F1 Analysis
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join the revolution in motorsport analytics. Start your free trial today and discover what professional F1
            analysis can reveal about racing performance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="glow-effect group">
              <Link href="/dashboard" className="flex items-center">
                Start Free Trial
                <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="accent-glow">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
