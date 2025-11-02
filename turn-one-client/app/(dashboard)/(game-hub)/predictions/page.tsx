"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Timer, Trophy, Target, AlertCircle, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PredictionsPage() {
  const [selectedDriver, setSelectedDriver] = useState("")
  const [selectedPosition, setSelectedPosition] = useState("")

  const drivers = [
    "Max Verstappen",
    "Lewis Hamilton",
    "Charles Leclerc",
    "Lando Norris",
    "Carlos Sainz",
    "Fernando Alonso",
    "George Russell",
    "Oscar Piastri",
    "Sergio Perez",
    "Lance Stroll"
  ]

  const positions = Array.from({ length: 10 }, (_, i) => `P${i + 1}`)

  if(true){
    return(
        <div className="min-h-screen bg-gradient-to-br from-black via-red-950 to-black flex flex-col items-center justify-center p-6 text-white">
      <div className="max-w-md text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-red-500">Coming Soon</h1>
          <h2 className="text-3xl font-semibold">Under Construction</h2>
          <p className="text-lg text-gray-300">
            This page is coming soon! We're working hard to bring you the best experience.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Button 
            variant="outline" 
            className="border-red-600 text-red-400 hover:bg-red-900/20"
            asChild
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            className="text-gray-300 hover:text-white hover:bg-gray-800/50"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Race Predictions</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-primary">
            <Timer className="h-4 w-4 mr-1" />
            24 days until race
          </Badge>
        </div>
      </div>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Abu Dhabi Grand Prix 2023</CardTitle>
          <CardDescription>
            Make your predictions for the upcoming race at Yas Marina Circuit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="qualifying" className="space-y-4">
            <TabsList>
              <TabsTrigger value="qualifying">Qualifying</TabsTrigger>
              <TabsTrigger value="race">Race</TabsTrigger>
              <TabsTrigger value="special">Special</TabsTrigger>
            </TabsList>

            <TabsContent value="qualifying" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Pole Position</h3>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem key={driver} value={driver}>
                          {driver}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Q3 Cut-off Time</h3>
                  <Input type="text" placeholder="1:23.000" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="race" className="space-y-4">
              <div className="grid gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Podium Prediction</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="text-sm text-muted-foreground">P1</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Winner" />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.map((driver) => (
                            <SelectItem key={driver} value={driver}>
                              {driver}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">P2</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Second" />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.map((driver) => (
                            <SelectItem key={driver} value={driver}>
                              {driver}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">P3</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Third" />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.map((driver) => (
                            <SelectItem key={driver} value={driver}>
                              {driver}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Fastest Lap</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map((driver) => (
                          <SelectItem key={driver} value={driver}>
                            {driver}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="text" placeholder="Predicted time: 1:26.000" />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="special" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">First DNF Prediction</CardTitle>
                      <Badge>50 coins</Badge>
                    </div>
                    <CardDescription>Predict which driver will be the first to retire</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map((driver) => (
                          <SelectItem key={driver} value={driver}>
                            {driver}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Safety Car Prediction</CardTitle>
                      <Badge>30 coins</Badge>
                    </div>
                    <CardDescription>Will there be a safety car during the race?</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button variant="outline">Yes</Button>
                      <Button variant="outline">No</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline">Save Draft</Button>
            <Button>
              Submit Predictions
              <Badge variant="secondary" className="ml-2">
                150 coins
              </Badge>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Accuracy Rate</span>
                <span className="font-semibold">67%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Predictions</span>
                <span className="font-semibold">324</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Coins Earned</span>
                <span className="font-semibold">4,892</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Best Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Perfect Podiums</span>
                <Badge variant="outline">12</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pole Positions</span>
                <Badge variant="outline">18</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Fastest Laps</span>
                <Badge variant="outline">15</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Check practice session times for better qualifying predictions</li>
              <li>• Consider track history for podium predictions</li>
              <li>• Weather forecast can affect race outcomes</li>
              <li>• Track characteristics influence overtaking possibilities</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}