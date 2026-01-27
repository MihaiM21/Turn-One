"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  User, 
  Settings, 
  Shield, 
  CreditCard, 
  Bell, 
  Globe, 
  Save,
  Camera,
  Calendar,
  Crown,
  Zap,
  AlertTriangle,
  Loader2,
  Trophy,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  X,
  AlertCircle
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { 
  fetchUserProfile, 
  updateUserProfile, 
  fetchTokenStatus, 
  updateUserPreferences,
  changeUserPassword
} from "@/lib/userService"
import { UserProfile, TokenStatus, UserPreferences, PasswordChangeRequest } from "@/types/user-types"
import { toast } from "sonner"

// Helper function to get features by plan type
const getFeaturesByPlan = (planType: string): string[] => {
  switch (planType) {
    case 'PRO':
      return [
        "Real-time telemetry data",
        "Advanced analytics dashboard",
        "Historical race data access",
        "Track comparison tools",
        "Export capabilities",
        "Priority support"
      ];
    case 'ELITE':
      return [
        "All PRO features",
        "Exclusive data insights",
        "Custom analytics",
        "API access",
        "White-label options",
        "Dedicated support"
      ];
    default: // BASIC
      return [
        "Basic telemetry data",
        "Standard analytics",
        "Limited data access"
      ];
  }
}

export default function AccountPage() {
  const { isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  
  const [profileData, setProfileData] = useState<UserProfile>({
    id: "",
    email: "",
    username: "",
    avatarUrl: "",
    plan: "BASIC",
    planStartDate: "",
    planEndDate: "",
    autoRenew: false,
    tokens: 0,
    coins: 0,
    lastTokenRefillDate: "",
    createdAt: "",
    lastLogin: ""
  })

  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null)
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    pushNotifications: false,
    dataUpdates: true,
    marketingEmails: false,
    darkMode: true,
    language: "en",
    timezone: "UTC"
  })

  const [passwordData, setPasswordData] = useState<PasswordChangeRequest>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  // Dialog states
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const [isChangingPlan, setIsChangingPlan] = useState(false)

  // Load user data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadUserData()
    }
  }, [isAuthenticated])

  const loadUserData = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token') || ''
      
      // Load profile data from auth/me endpoint
      const profileResponse = await fetchUserProfile(token)
      setProfileData(profileResponse)

      // Load token status from subscription/token-status
      try {
        const tokenResponse = await fetchTokenStatus(token)
        setTokenStatus(tokenResponse)
      } catch (error) {
        console.log('No token status data available')
      }

    } catch (error) {
      toast.error('Failed to load user data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      const token = localStorage.getItem('token') || ''
      
      const response = await updateUserProfile(token, profileData)
      if (response.success) {
        toast.success('Profile updated successfully!')
        setProfileData(response.data)
      } else {
        toast.error(response.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    try {
      setIsSaving(true)
      const token = localStorage.getItem('token') || ''
      
      const response = await updateUserPreferences(token, preferences)
      if (response.success) {
        toast.success('Preferences updated successfully!')
      } else {
        toast.error(response.message || 'Failed to update preferences')
      }
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Failed to update preferences')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    try {
      setIsSaving(true)
      const token = localStorage.getItem('token') || ''
      
      const response = await changeUserPassword(token, passwordData)
      if (response.success) {
        toast.success('Password updated successfully!')
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
      } else {
        toast.error(response.message || 'Failed to update password')
      }
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error('Failed to update password')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpgradePlan = (plan: string) => {
    setSelectedPlan(plan)
    setShowUpgradeDialog(true)
  }

  const handleDowngradePlan = (plan: string) => {
    setSelectedPlan(plan)
    setShowDowngradeDialog(true)
  }

  const confirmUpgrade = async () => {
    try {
      setIsChangingPlan(true)
      const token = localStorage.getItem('token') || ''
      
      // Map plan names to enum values (0=BASIC, 1=PRO, 2=ELITE)
      const planEnumMap: { [key: string]: number } = {
        'BASIC': 0,
        'PRO': 1,
        'ELITE': 2
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5271/api'}/subscription/upgrade`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planEnumMap[selectedPlan]),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Failed to upgrade plan')
      }

      await loadUserData()
      toast.success(`Successfully upgraded to ${selectedPlan} plan!`)
      setShowUpgradeDialog(false)
    } catch (error: any) {
      console.error('Error upgrading plan:', error)
      toast.error(error.message || 'Failed to upgrade plan')
    } finally {
      setIsChangingPlan(false)
    }
  }

  const confirmDowngrade = async () => {
    try {
      setIsChangingPlan(true)
      const token = localStorage.getItem('token') || ''
      
      // Map plan names to enum values (0=BASIC, 1=PRO, 2=ELITE)
      const planEnumMap: { [key: string]: number } = {
        'BASIC': 0,
        'PRO': 1,
        'ELITE': 2
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5271/api'}/subscription/downgrade`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planEnumMap[selectedPlan]),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Failed to downgrade plan')
      }

      await loadUserData()
      toast.success(`Plan downgrade scheduled! You'll switch to ${selectedPlan} after your current period ends.`)
      setShowDowngradeDialog(false)
    } catch (error: any) {
      console.error('Error downgrading plan:', error)
      toast.error(error.message || 'Failed to downgrade plan')
    } finally {
      setIsChangingPlan(false)
    }
  }

  const getPlanPrice = (plan: string) => {
    switch(plan) {
      case 'BASIC': return '$0'
      case 'PRO': return '$9.99'
      case 'ELITE': return '$19.99'
      default: return 'N/A'
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access your account settings.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading account data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in-0 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
            Account <span className="gradient-text">Settings</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your profile, subscription, and preferences
          </p>
        </div>
        <div className="flex gap-3">
          <Badge 
            variant="secondary" 
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold ${
              profileData.plan === 'ELITE' ? 'bg-gradient-to-r from-primary to-red-600 text-white' :
              profileData.plan === 'PRO' ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white' :
              'bg-muted text-muted-foreground'
            }`}
          >
            {profileData.plan === 'ELITE' ? <Crown className="h-4 w-4" /> :
             profileData.plan === 'PRO' ? <Trophy className="h-4 w-4" /> :
             <Zap className="h-4 w-4" />}
            {profileData.plan} Plan
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full md:w-fit grid-cols-2 bg-muted/50 p-1 backdrop-blur-sm border border-border/50 mb-8"> 
          <TabsTrigger 
            value="profile" 
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
          >
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger 
            value="subscription" 
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
          >
            <CreditCard className="h-4 w-4" />
            Subscription
          </TabsTrigger>
          {/* <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger> */}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <Card className="border-border/50 shadow-lg transition-all duration-300 hover:shadow-xl">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Profile Information</CardTitle>
                  <CardDescription className="text-base">
                    Update your personal information and profile details
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
                <div className="relative group">
                  <Avatar className="h-28 w-28 ring-4 ring-primary/20 transition-all duration-300 group-hover:ring-primary/40">
                    <AvatarImage src={profileData.avatarUrl || "/placeholder-user.jpg"} alt="Profile picture" />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary/30 to-primary/10">
                      {profileData.username ? profileData.username[0].toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    size="sm" 
                    className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full p-0 shadow-lg glow-effect transition-transform duration-300 hover:scale-110"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-2xl font-bold mb-1">
                    {profileData.username}
                  </h3>
                  <p className="text-muted-foreground mb-3">{profileData.email}</p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <Badge variant="outline" className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      Member since {profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : 'N/A'}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1.5 text-green-600 border-green-600/30">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Profile Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-semibold">Username</Label>
                  <Input
                    id="username"
                    value={profileData.username}
                    onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                    className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Current Plan</Label>
                  <div className="relative">
                    <Input
                      value={profileData.plan}
                      disabled
                      className="h-11 bg-muted/50"
                    />
                    <Crown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Tokens Remaining</Label>
                  <div className="relative">
                    <Input
                      value={`${profileData.tokens} tokens`}
                      disabled
                      className="h-11 bg-muted/50"
                    />
                    <Zap className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSaveProfile} 
                disabled={isSaving} 
                className="w-full md:w-auto glow-effect hover:scale-105 transition-all duration-300 px-8"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <Card className="border-border/50 shadow-lg transition-all duration-300 hover:shadow-xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-red-600"></div>
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Current Subscription</CardTitle>
                  <CardDescription className="text-base">
                    Manage your Turn One subscription and benefits
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative flex flex-col sm:flex-row items-center sm:items-start justify-between p-6 bg-gradient-to-br from-primary/10 to-transparent rounded-xl border border-primary/20 overflow-hidden group transition-all duration-300 hover:border-primary/40">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="flex items-center gap-4 relative z-10 mb-4 sm:mb-0">
                  <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {profileData.plan === 'ELITE' ? <Crown className="h-8 w-8 text-primary" /> :
                     profileData.plan === 'PRO' ? <Trophy className="h-8 w-8 text-primary" /> :
                     <Zap className="h-8 w-8 text-primary" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{profileData.plan || 'ENTHUSIAST'}</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {profileData.plan === 'PRO' 
                        ? 'Support the platform + more tokens, faster responses, and historical data' 
                        : profileData.plan === 'ELITE'
                        ? 'Premium support + unlimited tokens, API access, and priority processing'
                        : 'Full access to the platform, completely free'
                      }
                    </p>
                  </div>
                </div>
                <Badge 
                  className={`relative z-10 px-4 py-1.5 text-sm font-semibold ${
                    profileData.plan === 'ELITE' ? 'bg-gradient-to-r from-primary to-red-600 text-white' :
                    profileData.plan === 'PRO' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' :
                    'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
                  }`}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                  {profileData.plan !== 'BASIC' ? 'Active' : 'Free Forever'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-border/50 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-primary/40 group">
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto mb-3 p-3 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 w-fit group-hover:scale-110 transition-transform duration-300">
                      <Clock className="h-6 w-6 text-blue-500" />
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Next Refill</p>
                    <p className="text-2xl font-bold">
                      {tokenStatus?.daysUntilRefill !== undefined 
                        ? `${tokenStatus.daysUntilRefill} days`
                        : 'N/A'
                      }
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/50 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-primary/40 group">
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto mb-3 p-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 w-fit group-hover:scale-110 transition-transform duration-300">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Tokens</p>
                    <p className="text-2xl font-bold">
                      {tokenStatus?.tokensRemaining ?? profileData.tokens}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/50 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-primary/40 group">
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto mb-3 p-3 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 w-fit group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Status</p>
                    <p className={`text-2xl font-bold ${profileData.plan !== 'BASIC' ? 'text-green-600' : 'text-primary'}`}>
                      {profileData.plan !== 'BASIC' ? 'Premium' : 'Active'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h4 className="text-lg font-semibold">Plan Features</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getFeaturesByPlan(profileData.plan).map((feature, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200"
                    >
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
                        profileData.plan !== 'BASIC' ? 'bg-green-500/20' : 'bg-primary/20'
                      }`}>
                        <CheckCircle2 className={`h-3 w-3 ${
                          profileData.plan !== 'BASIC' ? 'text-green-500' : 'text-primary'
                        }`} />
                      </div>
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Uncomment them when the payment method is implemented */}
              {/* <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {profileData.plan !== 'ELITE' && (
                  <Button 
                    variant="default" 
                    className="flex-1 glow-effect hover:scale-105 transition-all duration-300"
                    onClick={() => handleUpgradePlan(profileData.plan === 'BASIC' ? 'PRO' : 'ELITE')}
                  >
                    Upgrade to {profileData.plan === 'BASIC' ? 'PRO' : 'ELITE'}
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                {profileData.plan !== 'BASIC' && (
                  <Button 
                    variant="outline" 
                    className="flex-1 hover:border-orange-500 hover:text-orange-500 transition-colors duration-300"
                    onClick={() => handleDowngradePlan(profileData.plan === 'ELITE' ? 'PRO' : 'BASIC')}
                  >
                    Downgrade to {profileData.plan === 'ELITE' ? 'PRO' : 'BASIC'}
                  </Button>
                )}
              </div> */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure how you want to receive updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Browser push notifications</p>
                  </div>
                  <Switch
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, pushNotifications: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Data Updates</p>
                    <p className="text-sm text-muted-foreground">Live telemetry and race updates</p>
                  </div>
                  <Switch
                    checked={preferences.dataUpdates}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, dataUpdates: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Emails</p>
                    <p className="text-sm text-muted-foreground">Product updates and offers</p>
                  </div>
                  <Switch
                    checked={preferences.marketingEmails}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, marketingEmails: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Appearance & Language
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Use dark theme</p>
                </div>
                <Switch
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, darkMode: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    {/* <SelectItem value="es">Español</SelectItem> */}
                    {/* <SelectItem value="fr">Français</SelectItem> */}
                    {/* <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleSavePreferences} disabled={isSaving} className="w-full md:w-auto">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Password & Security
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input 
                    id="currentPassword" 
                    type="password" 
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    placeholder="Enter new password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={isSaving} className="w-full md:w-auto">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </div>

              {/* <Separator /> */}

              {/* <div>
                <h4 className="text-sm font-medium mb-4">Two-Factor Authentication</h4>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">Two-factor authentication is not enabled</p>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
              </div> */}

              {/* <Separator /> */}

              {/* <div>
                <h4 className="text-sm font-medium mb-4">Active Sessions</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">Chrome on Windows • Monaco</p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </div>
              </div> */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upgrade Plan Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Crown className="h-6 w-6 text-primary" />
              Upgrade Your Plan
            </DialogTitle>
            <DialogDescription className="text-base">
              Unlock more features and support the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-bold">{selectedPlan} Plan</h4>
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  {getPlanPrice(selectedPlan)}/month
                </Badge>
              </div>
              <ul className="space-y-2">
                {selectedPlan === 'PRO' && (
                  <>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      5,000 tokens per month
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Historical data access (2020-2025)
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Priority processing & support
                    </li>
                  </>
                )}
                {selectedPlan === 'ELITE' && (
                  <>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Unlimited tokens
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Full API access
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      24/7 priority support
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Dedicated account manager
                    </li>
                  </>
                )}
              </ul>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Your upgrade will be activated immediately and you'll be charged on a monthly basis.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)} disabled={isChangingPlan}>
              Cancel
            </Button>
            <Button onClick={confirmUpgrade} disabled={isChangingPlan} className="glow-effect">
              {isChangingPlan ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
              ) : (
                <>Confirm Upgrade</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Downgrade Plan Dialog */}
      <Dialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              Downgrade Your Plan
            </DialogTitle>
            <DialogDescription className="text-base">
              Your current plan will remain active until it expires
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-bold">{selectedPlan} Plan</h4>
                <Badge variant="outline">
                  {getPlanPrice(selectedPlan)}/month
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                You'll keep your current {profileData.plan} benefits until {profileData.planEndDate ? new Date(profileData.planEndDate).toLocaleDateString() : 'the end of your billing period'}.
              </p>
              <ul className="space-y-2">
                {selectedPlan === 'BASIC' && (
                  <>
                    <li className="flex items-center gap-2 text-sm">
                      <X className="h-4 w-4 text-red-500" />
                      <span className="line-through">Historical data access</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <X className="h-4 w-4 text-red-500" />
                      <span className="line-through">Priority support</span>
                    </li>
                  </>
                )}
                {selectedPlan === 'PRO' && (
                  <>
                    <li className="flex items-center gap-2 text-sm">
                      <X className="h-4 w-4 text-red-500" />
                      <span className="line-through">Unlimited tokens (5,000/month instead)</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <X className="h-4 w-4 text-red-500" />
                      <span className="line-through">API access</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                After your current plan expires, you'll be switched to the {selectedPlan} plan. You can cancel this downgrade anytime before it takes effect.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDowngradeDialog(false)} disabled={isChangingPlan}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDowngrade} 
              disabled={isChangingPlan}
            >
              {isChangingPlan ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
              ) : (
                <>Confirm Downgrade</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>


  );
}