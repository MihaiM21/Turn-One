'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DocsPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold text-foreground mb-2">Turn One Documentation</h1>
      <p className="text-xl text-muted-foreground mb-8">Learn how to use the Turn One F1 Analytics Dashboard</p>

      {/* Quick Start */}
      <section className="space-y-4">
        <h2 className="text-3xl font-semibold text-foreground">Quick Start</h2>
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Essential steps to begin using Turn One</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2">
              <li>Create an account or sign in</li>
              <li>Get your API token from the settings page</li>
              <li>Choose between Live Dashboard or Telemetry Analysis</li>
            </ol>
          </CardContent>
        </Card>
      </section>

      {/* Live F1 Dashboard */}
      <section className="space-y-4">
        <h2 className="text-3xl font-semibold text-foreground">Live Formula 1 Dashboard</h2>
        <Card>
          <CardHeader>
            <CardTitle>Real-Time Race Tracking</CardTitle>
            <CardDescription>Monitor live race data and statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-xl font-semibold">Features</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Live timing data for all drivers</li>
              <li>Real-time position tracking</li>
              <li>Tire strategy visualization</li>
              <li>Gap times and intervals</li>
              <li>Sector times comparison</li>
              <li>DRS detection and activation zones</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6">Using the Live Dashboard</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Select the active session (Practice, Qualifying, or Race)</li>
              <li>Choose drivers to compare or monitor</li>
              <li>Use filters to focus on specific data points</li>
              <li>Toggle different visualization modes</li>
            </ol>
          </CardContent>
        </Card>
      </section>

      {/* Telemetry Plot Generator */}
      <section className="space-y-4">
        <h2 className="text-3xl font-semibold text-foreground">Telemetry Plot Generator</h2>
        <Card>
          <CardHeader>
            <CardTitle>Advanced Telemetry Analysis</CardTitle>
            <CardDescription>Generate and analyze detailed F1 telemetry data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Available Plot Types</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Lap Time Analysis</h4>
                  <p className="text-muted-foreground">Compare lap times and sector performance between drivers</p>
                  <ul className="list-disc list-inside text-sm">
                    <li>Overall lap time comparison</li>
                    <li>Sector-by-sector analysis</li>
                    <li>Performance trends over race distance</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Speed Trace</h4>
                  <p className="text-muted-foreground">Analyze speed, throttle, and brake data</p>
                  <ul className="list-disc list-inside text-sm">
                    <li>Corner entry and exit speeds</li>
                    <li>Throttle application patterns</li>
                    <li>Braking points and intensity</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Tire Temperature</h4>
                  <p className="text-muted-foreground">Monitor tire temperature evolution</p>
                  <ul className="list-disc list-inside text-sm">
                    <li>All four tires temperature tracking</li>
                    <li>Temperature variation over stint length</li>
                    <li>Optimal operating window analysis</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">G-Force Analysis</h4>
                  <p className="text-muted-foreground">Examine lateral and longitudinal forces</p>
                  <ul className="list-disc list-inside text-sm">
                    <li>Cornering G-forces</li>
                    <li>Acceleration and braking forces</li>
                    <li>Driver style comparison</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">How to Generate Plots</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Select the year and Grand Prix from the dropdown menus</li>
                <li>Choose the session type (Practice, Qualifying, Race)</li>
                <li>Select one or two drivers to compare</li>
                <li>Input your API token for data access</li>
                <li>Choose the plot type from the available options</li>
                <li>Click &ldquo;Generate Plot&rdquo; to visualize the data</li>
                <li>Use the export feature to save or share your analysis</li>
              </ol>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Advanced Features</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Custom lap range selection for focused analysis</li>
                <li>Multiple data overlay capabilities</li>
                <li>Interactive tooltips with detailed information</li>
                <li>Customizable plot styling and formatting</li>
                <li>Data export in various formats</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Best Practices */}
      <section className="space-y-4">
        <h2 className="text-3xl font-semibold text-foreground">Best Practices</h2>
        <Card>
          <CardHeader>
            <CardTitle>Tips for Better Analysis</CardTitle>
            <CardDescription>Get the most out of Turn One</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>Always compare similar session conditions for meaningful analysis</li>
              <li>Consider track evolution when analyzing practice sessions</li>
              <li>Use multiple plot types to get a comprehensive understanding</li>
              <li>Export and save important analyses for future reference</li>
              <li>Compare teammate performances for baseline reference</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* API Access */}
      <section className="space-y-4">
        <h2 className="text-3xl font-semibold text-foreground">API Access</h2>
        <Card>
          <CardHeader>
            <CardTitle>Using the Turn One API</CardTitle>
            <CardDescription>Integrate Turn One data into your applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Authentication</h3>
              <p>Include your API token in the request header:</p>
              <pre className="bg-muted p-4 rounded-lg mt-2">
                <code>{`Authorization: Bearer your_api_token`}</code>
              </pre>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Rate Limits</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Free tier: 60 requests per minute</li>
                <li>Pro tier: 300 requests per minute</li>
                <li>Enterprise tier: Custom limits available</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Support */}
      <section className="space-y-4 mb-8">
        <h2 className="text-3xl font-semibold text-foreground">Support</h2>
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>Ways to get support for Turn One</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>Visit our GitHub repository for technical documentation</li>
              <li>Join our Discord community for real-time support</li>
              <li>Contact support for enterprise solutions</li>
              <li>Check our FAQ section for common issues</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}