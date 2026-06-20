"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MapPin, Clock, Send, MessageSquare, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ObfuscatedEmail } from "@/components/ui/obfuscated-email";
import { MainNav } from "@/components/navigation/main-nav";
import { PublicHero } from "@/components/site/public-hero";
import { PublicCard } from "@/components/site/public-card";
import { SectionHeader } from "@/components/site/section-header";
import { toast } from "@/hooks/use-toast";

const channels = [
  {
    icon: Mail,
    title: "Email",
    body: (
      <ObfuscatedEmail
        user="contact"
        domain="t1f1.com"
        asLink
        className="font-mono text-sm text-primary transition-colors hover:text-primary/80"
      />
    ),
  },
  { icon: MessageSquare, title: "Live support", body: "Available during business hours for immediate help." },
  { icon: Clock, title: "Hours", body: "Mon–Fri · 09:00–18:00 GMT · Extended on race weekends." },
  { icon: MapPin, title: "Location", body: "Global team headquartered in motorsport country." },
];

const faqs = [
  { q: "How fast can I get started?", a: "Sign up takes ~30 seconds. You get instant access to current-season data and historical archives." },
  { q: "Do you offer team integrations?", a: "Yes — REST + WebSocket APIs and custom integrations for racing teams and motorsport organizations." },
  { q: "Where does the data come from?", a: "FIA timing, team telemetry feeds and verified historical archives. Aggregated and cross-checked." },
  { q: "Is there race-weekend support?", a: "Yes — extended hours on every F1 race weekend so you always have help live." },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5271/api").replace(/\/api$/, "");
      const response = await fetch(`${backendUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }
      const data = await response.json();
      if (response.ok && data.success) {
        toast({ title: "Message sent", description: "We'll get back to you within 24 hours." });
        setFormData({ firstName: "", lastName: "", email: "", company: "", subject: "", message: "" });
      } else {
        toast({
          title: "Failed to send",
          description: data.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending contact form:", error);
      toast({
        title: "Failed to send",
        description: "Unable to reach the server. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <MainNav />

      <PublicHero
        eyebrow="Contact · Get in touch"
        title="Let's talk telemetry."
        subtitle="Sales, support, custom integrations, partnerships — pick a channel and we'll respond fast."
        backgroundImage="/turn-one-car/2026-turn-one-car/0003.webp"
      />

      <main className="mx-auto max-w-7xl space-y-20 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          {/* Form */}
          <PublicCard className="p-6 sm:p-8">
            <SectionHeader eyebrow="Send a message" title="Tell us what you need" />
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                    First name
                  </Label>
                  <Input
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="First name"
                    className="rounded-none border-zinc-800 bg-black focus-visible:border-primary focus-visible:ring-0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Last name"
                    className="rounded-none border-zinc-800 bg-black focus-visible:border-primary focus-visible:ring-0"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="rounded-none border-zinc-800 bg-black focus-visible:border-primary focus-visible:ring-0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company" className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                  Company (optional)
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Your team or company"
                  className="rounded-none border-zinc-800 bg-black focus-visible:border-primary focus-visible:ring-0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                  Subject
                </Label>
                <Input
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="What's this about?"
                  className="rounded-none border-zinc-800 bg-black focus-visible:border-primary focus-visible:ring-0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                  Message
                </Label>
                <Textarea
                  id="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your needs, questions, or how we can help…"
                  className="resize-none rounded-none border-zinc-800 bg-black focus-visible:border-primary focus-visible:ring-0"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full rounded-none bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isSubmitting}
              >
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? "Sending…" : "Send message"}
              </Button>
            </form>
          </PublicCard>

          {/* Channels + quick actions */}
          <div className="space-y-4">
            <SectionHeader eyebrow="Channels" title="Other ways in" />
            {channels.map((c) => (
              <PublicCard key={c.title} hover className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-zinc-800 bg-zinc-900">
                    <c.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-tight">{c.title}</p>
                    <div className="mt-1 text-sm text-zinc-400">{c.body}</div>
                  </div>
                </div>
              </PublicCard>
            ))}

            <div className="space-y-2 pt-2">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full justify-start rounded-none border-zinc-800 bg-transparent text-zinc-200 hover:border-zinc-600 hover:bg-zinc-900"
              >
                <Link href="/features">
                  <MessageSquare className="mr-3 h-4 w-4 text-primary" />
                  View our features
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="w-full justify-start rounded-none bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link href="/auth/signup">
                  <CheckCircle2 className="mr-3 h-4 w-4" />
                  Start free
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <SectionHeader eyebrow="FAQ" title="Quick answers" />
          <div className="grid gap-3 md:grid-cols-2">
            {faqs.map((f) => (
              <PublicCard key={f.q} className="p-5">
                <p className="text-sm font-bold text-primary">{f.q}</p>
                <p className="mt-2 text-sm text-zinc-400">{f.a}</p>
              </PublicCard>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
