'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Signal, Database, ChartLine,
         BarChart, Timer, MapPin, Gauge, Wind, FileJson, 
         Mail, ExternalLink, Play,
         type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { DashboardHeader } from "@/components/dashboard/live dashboard/dashboard-header";
import { ExploreMoreLinks } from "@/components/dashboard/explore-more-links";

interface FeatureProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface DataElementProps {
  icon: LucideIcon;
  title: string;
  items: string[];
}

interface AnalysisToolProps {
  icon: LucideIcon;
  title: string;
  features: string[];
}

export default function DocumentationPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleContact = () => {
    toast({
      title: "Contact Request Sent",
      description: "Our support team will contact you shortly.",
    });
    router.push('/contact');
  };

  const handleApiDocs = () => {
    window.open('https://docs.t1f1.com/', '_blank');
  };

  const handleTutorials = () => {
    window.open('https://www.youtube.com/channel/UCg-DYx-XQUFeEol-IHmCi_Q', '_blank');
  };

  return (
    
    <div className="container mx-auto py-8 space-y-12">
      <DashboardHeader />
      {/* Header */}
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight gradient-text">Turn One Documentation</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your comprehensive guide to mastering Turn One's F1 data analytics platform
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => router.push('/live')}
        >
          <Signal className="mr-2 h-4 w-4" />
          Live Dashboard
        </Button>
        <Button 
          variant="outline"
          className="w-full"
          onClick={handleApiDocs}
        >
          <FileJson className="mr-2 h-4 w-4" />
          API Documentation
        </Button>
        <Button 
          variant="outline"
          className="w-full"
          onClick={handleTutorials}
        >
          <Play className="mr-2 h-4 w-4" />
          Video Tutorials
        </Button>
      </div>

      {/* Getting Started */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Getting Started</h2>
        <Card>
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
            <CardDescription>
              Understanding Turn One's core functionality and features
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Key Features</h3>
              <div className="space-y-4">
                <Feature
                  icon={Signal}
                  title="Real-time Telemetry"
                  description="Live F1 session data with sub-second latency"
                />
                <Feature
                  icon={ChartLine}
                  title="Advanced Analytics"
                  description="Comprehensive performance analysis tools"
                />
                <Feature
                  icon={Database}
                  title="Historical Data"
                  description="Access to complete F1 data archive"
                />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quick Setup</h3>
              <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
                <li>Access the Live Dashboard</li>
                <li>Connect to active F1 sessions</li>
                <li>Configure your data preferences</li>
                <li>Start analyzing real-time data</li>
              </ol>
              <Button 
                className="w-full mt-4"
                onClick={() => router.push('/live')}
              >
                Go to Live Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Live Dashboard */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Live Dashboard</h2>
        <Card>
          <CardHeader>
            <CardTitle>Real-time Monitoring</CardTitle>
            <CardDescription>
              Access live F1 session data and real-time analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <DataElement
                icon={Timer}
                title="Timing Data"
                items={[
                  "Lap times and intervals",
                  "Sector times",
                  "Speed traps",
                  "Gap analysis"
                ]}
              />
              <DataElement
                icon={Gauge}
                title="Telemetry"
                items={[
                  "Speed and RPM",
                  "Throttle/Brake",
                  "DRS status",
                  "Gear changes"
                ]}
              />
              <DataElement
                icon={Wind}
                title="Conditions"
                items={[
                  "Track temperature",
                  "Weather data",
                  "Wind conditions",
                  "Rain probability"
                ]}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Data Analysis */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Data Analysis</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalysisTool
                icon={BarChart}
                title="Lap Time Analysis"
                features={[
                  "Sector comparison",
                  "Stint analysis",
                  "Performance trends",
                  "Historical data"
                ]}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Track Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalysisTool
                icon={MapPin}
                title="Track Mapping"
                features={[
                  "Racing line analysis",
                  "Corner speed data",
                  "Overtaking zones",
                  "Position tracking"
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Advanced Features */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Advanced Features</h2>
        <Card>
          <CardHeader>
            <CardTitle>API & Integration</CardTitle>
            <CardDescription>
              Build custom solutions with our developer tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 rounded-lg border bg-muted/50">
                <h4 className="font-medium mb-2">API Authentication</h4>
                <code className="text-sm text-muted-foreground block">
                  Authorization: Bearer {'{your_api_key}'}
                </code>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={handleApiDocs}
                  className="w-full"
                >
                  <FileJson className="mr-2 h-4 w-4" />
                  API Documentation
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleApiDocs}
                  className="w-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Code Examples
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Support Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Get support from our team of F1 data experts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button 
              variant="outline"
              onClick={handleContact}
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
            <Button 
              variant="outline"
              onClick={handleApiDocs}
              className="w-full"
            >
              <FileJson className="mr-2 h-4 w-4" />
              API Docs
            </Button>
            <Button 
              variant="outline"
              onClick={handleTutorials}
              className="w-full"
            >
              <Play className="mr-2 h-4 w-4" />
              Tutorials
            </Button>
          </div>
        </CardContent>
      </Card>

      <ExploreMoreLinks currentPage="/docs" />
    </div>
  );
}

function Feature({ icon: Icon, title, description }: FeatureProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function DataElement({ icon: Icon, title, items }: DataElementProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h4 className="font-medium">{title}</h4>
      </div>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={index} className="text-sm text-muted-foreground">• {item}</li>
        ))}
      </ul>
    </div>
  );
}

function AnalysisTool({ icon: Icon, title, features }: AnalysisToolProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="font-medium">{title}</h3>
      </div>
      <ul className="space-y-1">
        {features.map((feature, index) => (
          <li key={index} className="text-sm text-muted-foreground">• {feature}</li>
        ))}
      </ul>
    </div>
  );
}