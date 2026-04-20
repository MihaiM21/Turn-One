'use client';

import {Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight, ChartNoAxesCombined } from "lucide-react";
import Link from "next/dist/client/link";



export function GeneratorCard() {
  return (
          <Link href="/generator" className="group">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 hover:border-primary/40 hover:from-primary/15 hover:to-primary/10 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/20">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <ChartNoAxesCombined className="w-5 h-5 text-primary group-hover:text-primary/80 transition-colors" />
                    Telemetry Plot Generator
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Create beautiful visualizations of F1 telemetry data in seconds. Choose from multiple plot types and customize your analysis.
                  </CardDescription>
                </div>
                <ArrowRight className="w-5 h-5 text-primary/60 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
              </CardHeader>
            </Card>
          </Link>
  );
}