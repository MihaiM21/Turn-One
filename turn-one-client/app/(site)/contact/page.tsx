'use client';

import { useState } from "react"
import { ObfuscatedEmail } from "@/components/ui/obfuscated-email"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MainNav } from "@/components/navigation/main-nav"
import { Mail, MapPin, Clock, Send, MessageSquare, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5271/api').replace(/\/api$/, '');
      const response = await fetch(`${backendUrl}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Message Sent! 🎉",
          description: "We'll get back to you within 24 hours.",
        });

        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          company: '',
          subject: '',
          message: ''
        });
      } else {
        toast({
          title: "Failed to Send Message",
          description: data.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending contact form:', error);
      toast({
        title: "Failed to Send Message",
        description: "Unable to connect to the server. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-background/95 pt-24 pb-16 border-b border-border/50">
        <div className="absolute inset-0 bg-[url('/turn-one-car/2026-turn-one-car/0003.webp')] bg-cover bg-center opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 text-sm font-medium border-primary/30 bg-primary/5 backdrop-blur-sm">
              Get In Touch
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">Contact</span>
              <span className="block mt-2">Turn One</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground text-pretty mb-8 max-w-3xl mx-auto">
              Ready to revolutionize your F1 analysis? Let&apos;s discuss how Turn One can accelerate your motorsport
              intelligence.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-24 bg-gradient-to-b from-background/95 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Send Us a Message</span>
                  </h2>
                  <p className="text-lg text-muted-foreground text-pretty">
                    Whether you&apos;re interested in our services, need technical support, or want to discuss a custom
                    solution, we&apos;re here to help.
                  </p>
                </div>

                <Card className="border-border/50 bg-card/50 backdrop-blur-lg shadow-xl">
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                            placeholder="Your first name"
                            className="bg-background/50 border-border/50 focus:border-primary transition-colors"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                          <Input 
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                            placeholder="Your last name" 
                            className="bg-background/50 border-border/50 focus:border-primary transition-colors"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="your.email@example.com"
                          className="bg-background/50 border-border/50 focus:border-primary transition-colors"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-sm font-medium">Company (Optional)</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData({...formData, company: e.target.value})}
                          placeholder="Your company or team"
                          className="bg-background/50 border-border/50 focus:border-primary transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => setFormData({...formData, subject: e.target.value})}
                          placeholder="What can we help you with?"
                          className="bg-background/50 border-border/50 focus:border-primary transition-colors"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-sm font-medium">Message</Label>
                        <Textarea
                          id="message"
                          value={formData.message}
                          onChange={(e) => setFormData({...formData, message: e.target.value})}
                          placeholder="Tell us more about your needs, questions, or how we can help you with F1 analysis..."
                          rows={6}
                          className="bg-background/50 border-border/50 focus:border-primary transition-colors resize-none"
                          required
                        />
                      </div>

                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/20 transition-all duration-300"
                        disabled={isSubmitting}
                      >
                        <Send className="mr-2 h-5 w-5" />
                        {isSubmitting ? 'Sending...' : 'Send Message'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Information */}
              <div>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Get In Touch</span>
                  </h2>
                  <p className="text-lg text-muted-foreground text-pretty">
                    Multiple ways to connect with our team of F1 analysis experts.
                  </p>
                </div>

                <div className="space-y-4">
                  <Card className="border-border/50 bg-card/50 backdrop-blur-lg hover:border-primary/30 transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                          <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">Email Us</CardTitle>
                          <CardDescription>
                            <ObfuscatedEmail
                              user="contact"
                              domain="t1f1.com"
                              asLink
                              className="text-primary hover:text-primary/80 transition-colors font-medium"
                            />
                          </CardDescription>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-card/50 backdrop-blur-lg hover:border-primary/30 transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                          <MessageSquare className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">Live Support</CardTitle>
                          <CardDescription>Available during business hours for immediate assistance</CardDescription>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-card/50 backdrop-blur-lg hover:border-primary/30 transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                          <Clock className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">Business Hours</CardTitle>
                          <CardDescription>
                            Monday - Friday: 9:00 AM - 6:00 PM (GMT)
                            <br />
                            Race Weekends: Extended support hours
                          </CardDescription>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-card/50 backdrop-blur-lg hover:border-primary/30 transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                          <MapPin className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">Location</CardTitle>
                          <CardDescription>
                            Global team with headquarters in the heart of motorsport country
                          </CardDescription>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Links */}
                <div className="mt-10">
                  <h3 className="text-xl font-bold mb-6">
                    <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Quick Actions</span>
                  </h3>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full justify-start border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                      asChild
                    >
                      <Link href="/services">
                        <MessageSquare className="mr-3 h-5 w-5 text-primary" />
                        View Our Services
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      className="w-full justify-start bg-primary hover:bg-primary/90 shadow-lg hover:shadow-primary/20 transition-all duration-300"
                      asChild
                    >
                      <Link href="/auth/signup">
                        <CheckCircle2 className="mr-3 h-5 w-5" />
                        Start Free Trial
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
      <section className="py-24 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Frequently Asked Questions</span>
              </h2>
              <p className="text-xl text-muted-foreground text-pretty">
                Quick answers to common questions about Turn One services.
              </p>
            </div>

            <div className="space-y-4">
              <Card className="border-border/50 bg-card/50 backdrop-blur-lg hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg">How quickly can I get started with Turn One?</CardTitle>
                  <CardDescription className="text-base pt-2">
                    You can start analyzing F1 data immediately after signing up. Our platform provides instant access
                    to current season data, and historical data going back decades.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-lg hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg">Do you offer custom integrations for racing teams?</CardTitle>
                  <CardDescription className="text-base pt-2">
                    Yes, we provide comprehensive API access and custom integration services for professional racing
                    teams and motorsport organizations. Contact our enterprise team for details.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-lg hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg">What data sources do you use for analysis?</CardTitle>
                  <CardDescription className="text-base pt-2">
                    We aggregate data from multiple official and verified sources, including FIA timing systems, team
                    telemetry feeds, and comprehensive historical archives to ensure accuracy and completeness.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-lg hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg">Is there support available during race weekends?</CardTitle>
                  <CardDescription className="text-base pt-2">
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
      <section className="py-24 bg-gradient-to-br from-primary via-primary to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/turn-one-car/2026-turn-one-car/0003.webp')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance text-primary-foreground">Ready to Get Started?</h2>
            <p className="text-xl mb-8 text-primary-foreground/90 text-pretty">
              Join thousands of F1 enthusiasts and professionals who trust Turn One for their motorsport analysis needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300" asChild>
                <Link href="/auth/signup">Start Free Trial</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent hover:border-primary-foreground transition-all duration-300"
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
