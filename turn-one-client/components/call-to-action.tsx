'use client';

import { ScrollAnimation } from "./animation/scroll-animation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

export function CallToAction() {
  return (
    <div className="container mx-auto px-4 text-center">
        <ScrollAnimation direction="up">
        <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">Ready to Elevate Your F1 Analysis?</h2>
            <p className="text-xl mb-8 opacity-90 text-pretty">
            Join the next generation of Formula One platform. Get access to professional telemetry analysis tools
            and real-time insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
                  size="lg"
                  className="text-lg px-8 py-6 glow-effect group relative overflow-hidden"
                  asChild
                >
                  <Link href="/dashboard">
                    Start Analysis
                  </Link>
                </Button>
            </div>
        </div>
        </ScrollAnimation>
    </div>
  );
}