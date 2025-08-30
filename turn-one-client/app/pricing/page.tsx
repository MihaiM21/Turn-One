import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, Zap, Trophy, Crown } from "lucide-react"
import { MainNav } from "@/components/navigation/main-nav"

export default function PricingPage() {
  const plans = [
    {
      name: "Enthusiast",
      price: "29",
      period: "month",
      description: "Perfect for F1 fans getting started with telemetry analysis",
      icon: Zap,
      popular: false,
      features: [
        { name: "Basic lap time analysis", included: true },
        { name: "Sector comparison (3 drivers)", included: true },
        { name: "Speed trace visualization", included: true },
        { name: "Track maps (current season)", included: true },
        { name: "Data export (CSV)", included: true },
        { name: "Email support", included: true },
        { name: "Advanced telemetry tools", included: false },
        { name: "Historical data access", included: false },
        { name: "Custom analysis reports", included: false },
        { name: "API access", included: false },
        { name: "Priority support", included: false },
      ],
    },
    {
      name: "Professional",
      price: "79",
      period: "month",
      description: "Advanced tools for serious motorsport analysts and teams",
      icon: Trophy,
      popular: true,
      features: [
        { name: "Advanced lap time analysis", included: true },
        { name: "Unlimited driver comparisons", included: true },
        { name: "Detailed speed trace analysis", included: true },
        { name: "All track maps (2020-2025)", included: true },
        { name: "Multiple export formats", included: true },
        { name: "Priority email support", included: true },
        { name: "Advanced telemetry tools", included: true },
        { name: "Historical data access", included: true },
        { name: "Custom analysis reports", included: true },
        { name: "Basic API access", included: true },
        { name: "Live chat support", included: false },
      ],
    },
    {
      name: "Elite",
      price: "149",
      period: "month",
      description: "Complete F1 analysis suite for professional teams and broadcasters",
      icon: Crown,
      popular: false,
      features: [
        { name: "Real-time telemetry analysis", included: true },
        { name: "Unlimited everything", included: true },
        { name: "AI-powered insights", included: true },
        { name: "Complete historical database", included: true },
        { name: "All export formats + API", included: true },
        { name: "24/7 phone support", included: true },
        { name: "Advanced telemetry tools", included: true },
        { name: "Historical data access", included: true },
        { name: "Custom analysis reports", included: true },
        { name: "Full API access", included: true },
        { name: "Dedicated account manager", included: true },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <MainNav variant="homepage" />

      {/* Hero Section */}
      <section className="relative py-20 px-4 pt-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-in fade-in-0 slide-in-from-top-6 duration-1000">
            <span className="gradient-text">Choose Your</span>
            <br />
            Racing Edge
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-in fade-in-0 slide-in-from-top-4 duration-1000 delay-300">
            Unlock the power of Formula One telemetry analysis with our professional-grade tools. From enthusiast
            insights to championship-level analytics.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon
              return (
                <Card
                  key={plan.name}
                  className={`relative card-hover hover:scale-105 transition-all duration-500 animate-in fade-in-0 slide-in-from-bottom-6 duration-700 ${plan.popular ? "border-primary glow-effect" : ""}`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground animate-pulse">
                      Most Popular
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-8">
                    <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit glow-effect hover:scale-110 transition-all duration-300">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
                    <div className="mt-6">
                      <span className="text-4xl font-bold gradient-text">${plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-center gap-3 animate-in fade-in-0 slide-in-from-left-2 duration-500"
                        style={{ animationDelay: `${index * 200 + featureIndex * 50}ms` }}
                      >
                        {feature.included ? (
                          <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className={feature.included ? "text-foreground" : "text-muted-foreground"}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </CardContent>

                  <CardFooter>
                    <Button
                      className={`w-full glow-effect hover:scale-105 transition-all duration-300 ${plan.popular ? "bg-primary hover:bg-primary/90" : ""}`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      Get Started
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 gradient-text animate-in fade-in-0 slide-in-from-top-4 duration-700">
            Frequently Asked Questions
          </h2>

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
                <h3 className="text-lg font-semibold mb-2 text-primary">Is there a free trial?</h3>
                <p className="text-muted-foreground">
                  All plans include a 14-day free trial with full access to features.
                </p>
              </div>
            </div>

            <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-6 duration-1000 delay-300">
              <div className="hover:bg-muted/30 p-4 rounded-lg transition-all duration-300">
                <h3 className="text-lg font-semibold mb-2 text-primary">Do you offer team discounts?</h3>
                <p className="text-muted-foreground">
                  Yes, we offer special pricing for racing teams and educational institutions. Contact us for details.
                </p>
              </div>

              <div className="hover:bg-muted/30 p-4 rounded-lg transition-all duration-300">
                <h3 className="text-lg font-semibold mb-2 text-primary">What about data accuracy?</h3>
                <p className="text-muted-foreground">
                  Our data is sourced directly from official channels and verified for accuracy within milliseconds.
                </p>
              </div>

              <div className="hover:bg-muted/30 p-4 rounded-lg transition-all duration-300">
                <h3 className="text-lg font-semibold mb-2 text-primary">Can I export my analysis?</h3>
                <p className="text-muted-foreground">
                  All plans include data export capabilities in various formats including CSV, JSON, and PDF reports.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center animate-in fade-in-0 slide-in-from-bottom-6 duration-1000">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to <span className="gradient-text">Dominate</span> the Track?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of F1 professionals and enthusiasts who trust Turn One for their telemetry analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="glow-effect hover:scale-105 transition-all duration-300">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="hover:scale-105 transition-all duration-300 bg-transparent">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
