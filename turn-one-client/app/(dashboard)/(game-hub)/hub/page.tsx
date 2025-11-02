"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, ChartScatter, Target, Coins, TrendingUp, Timer, ArrowLeft, Home } from "lucide-react"
import Link from "next/link"

export default function HubPage() {
  const [upcomingRace, setUpcomingRace] = useState({
    name: "Abu Dhabi Grand Prix",
    date: "November 26, 2023",
    timeLeft: "24 days"
  })

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
        <h2 className="text-3xl font-bold tracking-tight">Game Hub</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="space-x-2">
            <Coins className="h-4 w-4" />
            <span>1,250 coins</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#128</div>
            <p className="text-xs text-muted-foreground">
              Top 15% of players
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
            <ChartScatter className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">324</div>
            <p className="text-xs text-muted-foreground">
              Since you joined
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4,892</div>
            <p className="text-xs text-muted-foreground">
              Total coins earned
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Next Race Card */}
        <Card className="lg:col-span-2 card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Next Race Predictions
            </CardTitle>
            <CardDescription>
              Make your predictions for the upcoming race
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">{upcomingRace.name}</h3>
                  <p className="text-sm text-muted-foreground">{upcomingRace.date}</p>
                </div>
                <Badge variant="outline" className="text-primary">
                  {upcomingRace.timeLeft}
                </Badge>
              </div>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/predictions">Make Predictions</Link>
                </Button>
                <Button variant="outline">View Circuit Info</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard Preview */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Top Predictors
            </CardTitle>
            <CardDescription>
              This month's leading players
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold">#1</span>
                  <span>MaxVerstappen33</span>
                </div>
                <Badge>890 pts</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold">#2</span>
                  <span>LewisH44</span>
                </div>
                <Badge>845 pts</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold">#3</span>
                  <span>Leclerc16</span>
                </div>
                <Badge>812 pts</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 card-hover">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest predictions and rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">Japanese GP - Winner Prediction</p>
                  <p className="text-sm text-muted-foreground">Max Verstappen</p>
                </div>
                <Badge className="bg-green-500">+150 coins</Badge>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">Qatar GP - Podium Prediction</p>
                  <p className="text-sm text-muted-foreground">2/3 correct</p>
                </div>
                <Badge className="bg-blue-500">+75 coins</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">United States GP - Qualifying Prediction</p>
                  <p className="text-sm text-muted-foreground">Incorrect</p>
                </div>
                <Badge variant="secondary">0 coins</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Preview */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Coin Store</CardTitle>
            <CardDescription>
              Spend your earned coins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="font-medium">Premium Avatar</p>
                <Badge variant="outline">500 coins</Badge>
              </div>
              <div className="flex justify-between items-center">
                <p className="font-medium">Special Theme</p>
                <Badge variant="outline">750 coins</Badge>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/store">Visit Store</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}