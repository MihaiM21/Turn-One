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
  Loader2
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
      console.log('Profile response:', profileResponse)
      setProfileData(profileResponse)

      // Load token status from subscription/token-status
      try {
        const tokenResponse = await fetchTokenStatus(token)
        console.log('Token status response:', tokenResponse)
        setTokenStatus(tokenResponse)
      } catch (error) {
        console.log('No token status data available')
      }

    } catch (error) {
      console.error('Error loading user data:', error)
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
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile, subscription, and preferences
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-500" />
          {profileData.plan} Member
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileData.avatarUrl || "/placeholder-user.jpg"} alt="Profile picture" />
                    <AvatarFallback className="text-lg font-semibold">
                      {profileData.username ? profileData.username[0].toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button size="sm" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {profileData.username}
                  </h3>
                  <p className="text-muted-foreground">{profileData.email}</p>
                  <Badge variant="outline" className="mt-1">
                    Member since {profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : 'N/A'}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Profile Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profileData.username}
                    onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Plan</Label>
                  <Input
                    value={profileData.plan}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tokens Remaining</Label>
                  <Input
                    value={`${profileData.tokens} tokens`}
                    disabled
                  />
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full md:w-auto">
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
        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Current Subscription
              </CardTitle>
              <CardDescription>
                Manage your Turn One Pro subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{profileData.plan || 'BASIC'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {profileData.plan === 'PRO' 
                        ? 'Access to all telemetry data and advanced analytics' 
                        : profileData.plan === 'ELITE'
                        ? 'Premium access with exclusive features'
                        : 'Basic access to telemetry data'
                      }
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={profileData.plan !== 'BASIC' ? 'secondary' : 'outline'} 
                  className={profileData.plan !== 'BASIC' 
                    ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20" 
                    : "text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20"
                  }
                >
                  {profileData.plan !== 'BASIC' ? 'Active' : 'Basic'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Next Token Refill</p>
                    <p className="font-semibold">
                      {tokenStatus?.daysUntilRefill !== undefined 
                        ? `${tokenStatus.daysUntilRefill} days`
                        : 'N/A'
                      }
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Tokens Remaining</p>
                    <p className="font-semibold">
                      {tokenStatus?.tokensRemaining ?? profileData.tokens} tokens
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Plan Status</p>
                    <p className={`font-semibold ${profileData.plan !== 'BASIC' ? 'text-green-600' : 'text-gray-600'}`}>
                      {profileData.plan}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Plan Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getFeaturesByPlan(profileData.plan).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${profileData.plan !== 'BASIC' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline">Change Plan</Button>
                <Button variant="outline" className="text-red-600 hover:text-red-700">
                  Cancel Subscription
                </Button>
              </div>
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
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
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

              <Separator />

              <div>
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
              </div>

              <Separator />

              <div>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>


  );
}