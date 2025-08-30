import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MainNav } from "@/components/navigation/main-nav"
import { Mail, MapPin, Clock, Send, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden modern-gradient pt-24 pb-16">
        <div className="absolute inset-0 bg-[url('/formula-1-car-racing-on-track-dynamic-motion-blur.png')] bg-cover bg-center opacity-10" />
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 text-sm font-medium accent-glow">
              Get In Touch
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">
              <span className="gradient-text">Contact</span>
              <span className="block mt-2">Turn One</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground text-pretty mb-8 max-w-3xl mx-auto">
              Ready to revolutionize your F1 analysis? Let's discuss how Turn One can accelerate your motorsport
              intelligence.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16">
              {/* Contact Form */}
              <div>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-4 gradient-text">Send Us a Message</h2>
                  <p className="text-lg text-muted-foreground text-pretty">
                    Whether you're interested in our services, need technical support, or want to discuss a custom
                    solution, we're here to help.
                  </p>
                </div>

                <Card className="card-hover">
                  <CardHeader>
                    <form className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            placeholder="Your first name"
                            className="glow-effect focus:accent-glow"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" placeholder="Your last name" className="glow-effect focus:accent-glow" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          className="glow-effect focus:accent-glow"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company">Company (Optional)</Label>
                        <Input
                          id="company"
                          placeholder="Your company or team"
                          className="glow-effect focus:accent-glow"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          placeholder="What can we help you with?"
                          className="glow-effect focus:accent-glow"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          placeholder="Tell us more about your needs, questions, or how we can help you with F1 analysis..."
                          rows={6}
                          className="glow-effect focus:accent-glow resize-none"
                        />
                      </div>

                      <Button type="submit" size="lg" className="w-full glow-effect">
                        <Send className="mr-2 h-5 w-5" />
                        Send Message
                      </Button>
                    </form>
                  </CardHeader>
                </Card>
              </div>

              {/* Contact Information */}
              <div>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-4 gradient-text">Get In Touch</h2>
                  <p className="text-lg text-muted-foreground text-pretty">
                    Multiple ways to connect with our team of F1 analysis experts.
                  </p>
                </div>

                <div className="space-y-6">
                  <Card className="card-hover">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center glow-effect">
                          <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Email Us</CardTitle>
                          <CardDescription>
                            <a
                              href="mailto:hello@t1f1.com"
                              className="text-accent hover:text-accent/80 transition-colors"
                            >
                              hello@t1f1.com
                            </a>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  <Card className="card-hover">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center accent-glow">
                          <MessageSquare className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Live Support</CardTitle>
                          <CardDescription>Available during business hours for immediate assistance</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  <Card className="card-hover">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center glow-effect">
                          <Clock className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Business Hours</CardTitle>
                          <CardDescription>
                            Monday - Friday: 9:00 AM - 6:00 PM (GMT)
                            <br />
                            Race Weekends: Extended support hours
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  <Card className="card-hover">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center accent-glow">
                          <MapPin className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Location</CardTitle>
                          <CardDescription>
                            Global team with headquarters in the heart of motorsport country
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </div>

                {/* Quick Links */}
                <div className="mt-12">
                  <h3 className="text-xl font-bold mb-6 gradient-text">Quick Actions</h3>
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full justify-start glow-effect bg-transparent"
                      asChild
                    >
                      <Link href="/services">
                        <MessageSquare className="mr-3 h-5 w-5" />
                        View Our Services
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full justify-start accent-glow bg-transparent"
                      asChild
                    >
                      <Link href="/auth/signup">
                        <Send className="mr-3 h-5 w-5" />
                        Start Free Trial
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full justify-start glow-effect bg-transparent"
                      asChild
                    >
                      <Link href="/dashboard">
                        <MapPin className="mr-3 h-5 w-5" />
                        View Demo Dashboard
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 modern-gradient">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Frequently Asked Questions</h2>
              <p className="text-xl text-muted-foreground text-pretty">
                Quick answers to common questions about Turn One services.
              </p>
            </div>

            <div className="space-y-6">
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="text-lg">How quickly can I get started with Turn One?</CardTitle>
                  <CardDescription className="text-base">
                    You can start analyzing F1 data immediately after signing up. Our platform provides instant access
                    to current season data, and historical data going back decades.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="text-lg">Do you offer custom integrations for racing teams?</CardTitle>
                  <CardDescription className="text-base">
                    Yes, we provide comprehensive API access and custom integration services for professional racing
                    teams and motorsport organizations. Contact our enterprise team for details.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="text-lg">What data sources do you use for analysis?</CardTitle>
                  <CardDescription className="text-base">
                    We aggregate data from multiple official and verified sources, including FIA timing systems, team
                    telemetry feeds, and comprehensive historical archives to ensure accuracy and completeness.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="text-lg">Is there support available during race weekends?</CardTitle>
                  <CardDescription className="text-base">
                    We provide extended support hours during all F1 race weekends to ensure you have assistance when you
                    need it most for live analysis and real-time insights.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground glow-effect">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">Ready to Get Started?</h2>
            <p className="text-xl mb-8 opacity-90 text-pretty">
              Join thousands of F1 enthusiasts and professionals who trust Turn One for their motorsport analysis needs.
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
                <Link href="/services">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
