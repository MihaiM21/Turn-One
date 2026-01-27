import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, Zap, Trophy, Crown, Camera, Users, TrendingUp, Shield } from "lucide-react"
import { MainNav } from "@/components/navigation/main-nav"
import Link from "next/link"
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing - Free F1 Telemetry Analysis | Turn One',
  description: 'Turn One is 100% free to use. Access professional F1 telemetry analysis, live race data, and lap time comparisons. Optional paid plans support the platform and unlock enhanced features.',
  keywords: ['F1 telemetry', 'free F1 analysis', 'Formula 1 data', 'racing telemetry', 'F1 lap times', 'motorsport analytics'],
  openGraph: {
    title: 'Free F1 Telemetry Analysis Platform | Turn One',
    description: 'Professional F1 telemetry analysis, completely free. No credit card required.',
    type: 'website',
  },
}

export default function PricingPage() {
  const plans = [
    
    {
      name: "Enthusiast",
      price: "0",
      period: "forever",
      description: "Everything you need to start analyzing F1 telemetry. No credit card, no catch.",
      icon: Zap,
      popular: false,
      features: [
        { name: "Live race telemetry & timing", included: true },
        { name: "Lap time analysis & comparison", included: true },
        { name: "Speed traces & sector times", included: true },
        { name: "Track maps (current season)", included: true },
        { name: "Basic AI-powered insights", included: true },
        { name: "Community support", included: true },
        { name: "200 tokens/month", included: true },
        { name: "Data export (CSV)", included: false },
        { name: "Historical data (2020-2025)", included: false },
        { name: "Priority processing", included: false },
        { name: "API access", included: false },
      ],
    },
    {
      name: "Professional",
      price: "9.99",
      period: "month",
      description: "Support our mission + unlock 500 tokens/month and historical F1 data archives",
      icon: Trophy,
      popular: true,
      features: [
        { name: "Everything in Enthusiast", included: true },
        { name: "500 tokens/month", included: true },
        { name: "Historical data (2020-2025)", included: true },
        { name: "Advanced AI insights", included: true },
        { name: "Multi-format data export", included: true },
        { name: "Priority processing queue", included: true },
        { name: "Priority email support", included: true },
        { name: "Custom analysis reports", included: true },
        { name: "Early access to features", included: true },
        { name: "API access", included: false },
        { name: "Dedicated account manager", included: false },
      ],
    },
    {
      name: "Elite",
      price: "19.99",
      period: "month",
      description: "Maximum support + unlimited tokens, full API access, and white-glove service",
      icon: Crown,
      popular: false,
      features: [
        { name: "Everything in Professional", included: true },
        { name: "Unlimited tokens", included: true },
        { name: "Full REST API access", included: true },
        { name: "Complete historical database", included: true },
        { name: "Real-time WebSocket feeds", included: true },
        { name: "Highest priority processing", included: true },
        { name: "24/7 priority support", included: true },
        { name: "Custom integrations", included: true },
        { name: "Dedicated account manager", included: true },
        { name: "Beta features access", included: true },
        { name: "Commercial usage rights", included: true },
      ],
    },
    {
      name: "Content Creator",
      price: "Custom",
      period: "contact us",
      description: "Built for YouTube channels, podcasts, and professional content creators",
      icon: Camera,
      popular: false,
      features: [
        { name: "Everything in Elite", included: true },
        { name: "Unlimited everything", included: true },
        { name: "Custom branding & watermarks", included: true },
        { name: "Export in 4K resolution", included: true },
        { name: "Broadcast-ready graphics", included: true },
        { name: "White-label options", included: true },
        { name: "Direct messaging support", included: true },
        { name: "Content collaboration tools", included: true },
        { name: "Revenue sharing program", included: true },
        { name: "Featured creator spotlight", included: true },
        { name: "Custom feature requests", included: true },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <MainNav variant="homepage" />

      {/* Hero Section */}
      <section className="relative py-20 px-4 pt-32">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-6 animate-in fade-in-0 slide-in-from-top-4 duration-1000">
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none shadow-lg px-6 py-2.5 text-base font-semibold">
              ✨ 100% Free Forever - No Credit Card Required
            </Badge>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-in fade-in-0 slide-in-from-top-6 duration-1000 delay-100">
            Professional F1 Telemetry,
            <br />
            <span className="gradient-text">Completely Free</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-in fade-in-0 slide-in-from-top-4 duration-1000 delay-200">
            Access the same telemetry tools used by racing analysts and content creators. <span className="font-semibold text-foreground">No paywalls, no limits.</span> Paid plans simply support our mission and unlock premium perks.
          </p>
          
          {/* Social Proof */}
          <div className="flex flex-wrap justify-center items-center gap-8 mt-12 mb-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-300">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground"><span className="font-bold text-foreground">10,000+</span> Users</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground"><span className="font-bold text-foreground">1M+</span> Analyses</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground"><span className="font-bold text-foreground">Real-time</span> Data</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your <span className="gradient-text">Experience Level</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free and upgrade anytime to support the platform and unlock premium features
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon
              return (
                <Card
                  key={plan.name}
                  className={`relative card-hover transition-all duration-500 animate-in fade-in-0 slide-in-from-bottom-6 duration-700 overflow-visible group ${plan.popular ? "border-primary shadow-[0_0_30px_rgba(225,29,72,0.3)]" : ""}`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                  )}
                  {plan.popular && (
                    <Badge className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-red-600 text-white border-none shadow-lg px-4 py-1.5 text-sm font-semibold z-10">
                      Most Popular
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-8 pt-8">
                    <div className="mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 w-fit transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(225,29,72,0.3)]">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                    <CardDescription className="text-muted-foreground min-h-12">{plan.description}</CardDescription>
                    <div className="mt-6">
                      {plan.price === "Custom" ? (
                        <div className="space-y-1">
                          <span className="text-3xl font-bold bg-gradient-to-r from-primary to-red-600 bg-clip-text text-transparent">
                            Custom Pricing
                          </span>
                          <p className="text-sm text-muted-foreground">Tailored to your needs</p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-5xl font-bold bg-gradient-to-r from-primary to-red-600 bg-clip-text text-transparent">${plan.price}</span>
                          <span className="text-muted-foreground text-lg">/{plan.period}</span>
                        </div>
                      )}
                      
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-center gap-3 animate-in fade-in-0 slide-in-from-left-2 duration-500 text-sm"
                        style={{ animationDelay: `${index * 200 + featureIndex * 50}ms` }}
                      >
                        {feature.included ? (
                          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Check className="h-3 w-3 text-primary" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <X className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                        <span className={feature.included ? "text-foreground" : "text-muted-foreground line-through"}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </CardContent>

                  <CardFooter className="pt-6">
                    <Button
                      className={`w-full transition-all duration-300 group/button ${plan.popular ? "glow-effect" : "accent-glow"}`}
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                    >
                      {plan.name === "Enthusiast" ? (
                        <Link href="/dashboard" className="flex items-center justify-center w-full">
                          Start Free - No Signup
                          <span className="ml-2 inline-block transition-transform group-hover/button:translate-x-1">→</span>
                        </Link>
                      ) : plan.price === "Custom" ? (
                        <Link href="/contact" className="flex items-center justify-center w-full">
                          Contact Us
                          <span className="ml-2 inline-block transition-transform group-hover/button:translate-x-1">→</span>
                        </Link>
                      ) : (
                        <span>Coming Soon - Join Waitlist</span>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
              <div className="mx-auto mb-4 p-3 rounded-full bg-primary/20 w-fit">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Credit Card</h3>
              <p className="text-muted-foreground">Start using all features immediately. No signup forms, no payment details.</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
              <div className="mx-auto mb-4 p-3 rounded-full bg-primary/20 w-fit">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Community First</h3>
              <p className="text-muted-foreground">Built by F1 fans, for F1 fans. Your support helps us grow and improve.</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
              <div className="mx-auto mb-4 p-3 rounded-full bg-primary/20 w-fit">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Always Improving</h3>
              <p className="text-muted-foreground">New features every month. Your feedback directly shapes our roadmap.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 gradient-text animate-in fade-in-0 slide-in-from-top-4 duration-700">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Everything you need to know about Turn One's free F1 telemetry platform
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-left-6 duration-1000">
              <div className="hover:bg-muted/30 p-4 rounded-lg transition-all duration-300">
                <h3 className="text-lg font-semibold mb-2 text-primary">Can I change plans anytime?</h3>
                <p className="text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>

              <div className="hover:bg-muted/30 p-4 rounded-lg transition-all duration-300">
                <h3 className="text-lg font-semibold mb-2 text-primary">What data sources do you use?</h3>
                <p className="text-muted-foreground">
                  We aggregate data from official F1 timing systems, FIA databases, and verified telemetry sources.
                </p>
              </div>

              <div className="hover:bg-muted/30 p-4 rounded-lg transition-all duration-300">
                <h3 className="text-lg font-semibold mb-2 text-primary">Is Turn One really free forever?</h3>
                <p className="text-muted-foreground">
                  Absolutely! Turn One is free forever with no hidden costs. Paid plans are optional and simply help support the platform while unlocking premium features like more tokens, historical data, and priority support.
                </p>
              </div>
            </div>

            <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-6 duration-1000 delay-300">
              <div className="hover:bg-muted/30 p-4 rounded-lg transition-all duration-300">
                <h3 className="text-lg font-semibold mb-2 text-primary">Do you offer team discounts?</h3>
                <p className="text-muted-foreground">
                  Yes, we offer special pricing for teams and educational institutions. Contact us for details.
                </p>
              </div>

              <div className="hover:bg-muted/30 p-4 rounded-lg transition-all duration-300">
                <h3 className="text-lg font-semibold mb-2 text-primary">What about data accuracy?</h3>
                <p className="text-muted-foreground">
                  Our data is sourced directly from official channels and verified for accuracy within milliseconds.
                </p>
              </div>

              <div className="hover:bg-muted/30 p-4 rounded-lg transition-all duration-300">
                <h3 className="text-lg font-semibold mb-2 text-primary">What do I get by paying?</h3>
                <p className="text-muted-foreground">
                  Paid plans help keep the platform running and provide benefits like increased token limits, faster response times, historical data access, priority support, and API access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10 animate-in fade-in-0 slide-in-from-bottom-6 duration-1000">
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 px-4 py-2">
            Join 1,000+ F1 Fans
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Start Analyzing F1 Telemetry
            <br />
            <span className="gradient-text">In The Next 30 Seconds</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            No signup. No credit card. No waiting. Just click and start exploring live F1 data instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="glow-effect hover:scale-105 transition-all duration-300 text-lg px-8 py-6">
              <Link href="/dashboard">Start Free Instantly →</Link>
            </Button>
            <Button size="lg" variant="outline" className="hover:scale-105 transition-all duration-300 bg-transparent text-lg px-8 py-6">
              <Link href="/contact">Talk to Our Team</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            ✓ No installation required &nbsp; ✓ Works in browser &nbsp; ✓ Free forever
          </p>
        </div>
      </section>
    </div>
  )
}
