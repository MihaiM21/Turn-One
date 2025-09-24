'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Users, Crown, Shield, TrendingUp, Download, Filter, MoreHorizontal, Calendar, Activity, UserCheck, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import * as adminService from '@/lib/adminService';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN';
  plan: 'BASIC' | 'PRO' | 'ELITE' | 'CONTENT_CREATOR';
  tokens: number;
  createdAt: string;
  lastLogin?: string;
}

interface CurrentUser {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN';
  plan: 'BASIC' | 'PRO' | 'ELITE' | 'CONTENT_CREATOR';
  tokens: number;
}

const planNames: Record<string, string> = {
  BASIC: '0 - Basic',
  PRO: '1 - Pro',
  ELITE: '2 - Elite',
  CONTENT_CREATOR: '3 - Content Creator',
  // Also handle numeric values in case API returns numbers
  '0': '0 - Basic',
  '1': '1 - Pro', 
  '2': '2 - Elite',
  '3': '3 - Content Creator'
};

const planColors: Record<string, string> = {
  BASIC: 'bg-muted text-muted-foreground',
  PRO: 'bg-primary/10 text-primary',
  ELITE: 'bg-accent/10 text-accent',
  CONTENT_CREATOR: 'bg-primary/20 text-primary',
  // Also handle numeric values
  '0': 'bg-muted text-muted-foreground',
  '1': 'bg-primary/10 text-primary',
  '2': 'bg-accent/10 text-accent',
  '3': 'bg-primary/20 text-primary'
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPlan, setNewPlan] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('newest');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const checkAdminAccess = async () => {
    const result = await adminService.checkAdminAccess();
    
    if (!result.success) {
      if (result.error === 'No token found') {
        router.push('/auth/login');
        return;
      }
      
      toast({
        title: "Access Denied",
        description: result.error === 'Not admin' ? "You don't have admin privileges." : "Failed to verify admin access.",
        variant: "destructive",
      });
      router.push('/dashboard');
    }
  };

  const fetchCurrentUser = async () => {
    // Get current user info from token or API
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      try {
        // For now, we'll use a placeholder. In a real app, decode token or call API
        const mockCurrentUser: CurrentUser = {
          id: 'current-user',
          username: 'Admin User',
          email: 'admin@turnone.com',
          role: 'ADMIN',
          plan: 'ELITE', // This should come from actual user data
          tokens: 50000
        };
        setCurrentUser(mockCurrentUser);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    }
  };

  const fetchUsers = async () => {
    const result = await adminService.fetchUsers();
    
    if (result.success) {
      console.log('Fetched users:', result.data); // Debug log
      console.log('Plan names mapping:', planNames); // Debug log
      setUsers(result.data);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const updateUserPlan = async (userId: string, planType: string) => {
    // Validate plan change restrictions
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const isValidChange = canChangePlan(user.plan, planType);
    if (!isValidChange) {
      toast({
        title: "Invalid Plan Change",
        description: "You can only upgrade users to Content Creator or remove Content Creator status.",
        variant: "destructive",
      });
      return;
    }

    const result = await adminService.updateUserPlan(userId, planType);
    
    if (result.success) {
      toast({
        title: "Success",
        description: "User plan updated successfully.",
      });
      fetchUsers();
      setSelectedUser(null);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const canChangePlan = (currentPlan: string, newPlan: string): boolean => {
    // Only allow changes to/from Content Creator
    if (currentPlan === 'CONTENT_CREATOR') {
      // Can downgrade from Content Creator to any plan
      return true;
    } else {
      // Can only upgrade to Content Creator
      return newPlan === 'CONTENT_CREATOR';
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    const result = await adminService.updateUserRole(userId, role);
    
    if (result.success) {
      toast({
        title: "Success",
        description: "User role updated successfully.",
      });
      fetchUsers();
      setSelectedUser(null);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    const result = await adminService.deleteUser(userId);
    
    if (result.success) {
      toast({
        title: "Success",
        description: "User deleted successfully.",
      });
      fetchUsers();
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg font-medium text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalUsers = users.length;
  const adminCount = users.filter(user => user.role === 'ADMIN').length;
  const totalTokens = users.reduce((sum, user) => sum + user.tokens, 0);
  const planDistribution = users.reduce((acc, user) => {
    acc[user.plan] = (acc[user.plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesPlan = planFilter === 'ALL' || user.plan === planFilter;
    return matchesSearch && matchesRole && matchesPlan;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'tokens-high':
        return b.tokens - a.tokens;
      case 'tokens-low':
        return a.tokens - b.tokens;
      case 'alphabetical':
        return a.username.localeCompare(b.username);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black">
      <div className="container mx-auto p-6">
        {/* Header Section with Current User Info */}
        <div className="mb-8">
          <div className="modern-gradient rounded-2xl p-8 shadow-lg glow-effect">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 gradient-text">Admin Dashboard</h1>
                <p className="text-muted-foreground text-lg">Manage users, plans, and system administration</p>
              </div>
              {currentUser && (
                <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-primary-foreground font-bold glow-effect">
                        {currentUser.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{currentUser.username}</p>
                        <div className="flex items-center space-x-2 text-sm">
                          <Badge className={`${planColors[currentUser.plan]} text-xs`}>
                            {planNames[currentUser.plan]}
                          </Badge>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{currentUser.tokens.toLocaleString()} tokens</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-foreground">{totalUsers}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 7*24*60*60*1000)).length} new this week
                  </p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center glow-effect">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Admin Users</p>
                  <p className="text-3xl font-bold text-foreground">{adminCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((adminCount / totalUsers) * 100).toFixed(1)}% of users
                  </p>
                </div>
                <div className="h-12 w-12 bg-accent/10 rounded-full flex items-center justify-center accent-glow">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Tokens</p>
                  <p className="text-3xl font-bold text-foreground">{totalTokens.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg: {totalUsers ? Math.round(totalTokens / totalUsers).toLocaleString() : 0} per user
                  </p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center glow-effect">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Content Creators</p>
                  <p className="text-3xl font-bold text-foreground">{planDistribution.CONTENT_CREATOR || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Elite: {planDistribution.ELITE || 0} • Pro: {planDistribution.PRO || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-accent/10 rounded-full flex items-center justify-center accent-glow">
                  <Crown className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search and Filters Section */}
        <Card className="mb-6 card-hover">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="text-lg">User Management Tools</CardTitle>
                <CardDescription>Search, filter, and manage user accounts</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="accent-glow hover:scale-105 transition-all duration-300">
                  <Download className="h-4 w-4 mr-2" />
                  Export Users
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users by username or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="USER">Users</SelectItem>
                  <SelectItem value="ADMIN">Admins</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Plans</SelectItem>
                  <SelectItem value="BASIC">Basic</SelectItem>
                  <SelectItem value="PRO">Pro</SelectItem>
                  <SelectItem value="ELITE">Elite</SelectItem>
                  <SelectItem value="CONTENT_CREATOR">Content Creator</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="tokens-high">Most Tokens</SelectItem>
                  <SelectItem value="tokens-low">Least Tokens</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Filter className="h-3 w-3" />
                Showing {sortedUsers.length} of {totalUsers} users
              </span>
              {searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Search: {searchTerm}
                </Badge>
              )}
              {roleFilter !== 'ALL' && (
                <Badge variant="secondary" className="text-xs">
                  Role: {roleFilter}
                </Badge>
              )}
              {planFilter !== 'ALL' && (
                <Badge variant="secondary" className="text-xs">
                  Plan: {planFilter}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced User Management Card */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-2xl gradient-text">Users Management</CardTitle>
            <CardDescription className="text-muted-foreground">
              Showing {sortedUsers.length} of {totalUsers} users • Sorted by {sortBy.replace('-', ' ')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedUsers.map((user) => (
                <div key={user.id} className="bg-card rounded-xl p-6 border border-primary/10 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/30 card-hover">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="h-12 w-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-primary-foreground font-bold glow-effect">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-lg text-foreground">{user.username}</h3>
                            <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                              {user.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <Badge className={`${planColors[user.plan] || 'bg-muted text-muted-foreground'} font-medium text-xs`}>
                              {user.plan && planNames[user.plan] ? planNames[user.plan] : `${user.plan || 'Unknown'}`}
                            </Badge>
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-3 w-3 text-primary" />
                              <span className="text-muted-foreground font-medium">{user.tokens.toLocaleString()} tokens</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Joined: {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {user.lastLogin && (
                              <div className="flex items-center space-x-1">
                                <Activity className="h-3 w-3 text-green-500" />
                                <span className="text-muted-foreground">
                                  Last Login: {new Date(user.lastLogin).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Additional User Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-muted/20 rounded-lg">
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">{user.tokens.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Total Tokens</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">
                            {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                          </p>
                          <p className="text-xs text-muted-foreground">Days Active</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground capitalize">
                            {user.plan && planNames[user.plan] ? planNames[user.plan] : `${user.plan || 'Unknown'} Plan`}
                          </p>
                          <p className="text-xs text-muted-foreground">Subscription</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center">
                            {user.lastLogin ? (
                              <UserCheck className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-orange-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {user.lastLogin ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 mt-4 lg:mt-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="accent-glow hover:scale-105 transition-all duration-300"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewPlan(user.plan);
                            }}
                            disabled={!canChangePlan(user.plan, 'CONTENT_CREATOR') && user.plan !== 'CONTENT_CREATOR'}
                          >
                            Edit Plan
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-xl gradient-text">Update User Plan</DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                              Change the subscription plan for <span className="font-semibold">{user.username}</span>
                              <br />
                              <span className="text-xs text-orange-500 mt-1 block">
                                Note: You can only upgrade to Content Creator or downgrade from Content Creator
                              </span>
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-6">
                            <Select value={newPlan} onValueChange={setNewPlan}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a plan" />
                              </SelectTrigger>
                              <SelectContent>
                                {user.plan === 'CONTENT_CREATOR' ? (
                                  <>
                                    <SelectItem value="BASIC">Basic</SelectItem>
                                    <SelectItem value="PRO">Pro</SelectItem>
                                    <SelectItem value="ELITE">Elite</SelectItem>
                                    <SelectItem value="CONTENT_CREATOR">Content Creator</SelectItem>
                                  </>
                                ) : (
                                  <>
                                    <SelectItem value={user.plan} disabled>
                                      {planNames[user.plan]} (Current)
                                    </SelectItem>
                                    <SelectItem value="CONTENT_CREATOR">Content Creator</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => selectedUser && updateUserPlan(selectedUser.id, newPlan)}
                              className="glow-effect hover:scale-105 transition-all duration-300"
                              disabled={newPlan === user.plan}
                            >
                              Update Plan
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="accent-glow hover:scale-105 transition-all duration-300"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewRole(user.role);
                            }}
                          >
                            Edit Role
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-xl gradient-text">Update User Role</DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                              Change the access role for <span className="font-semibold">{user.username}</span>
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-6">
                            <Select value={newRole} onValueChange={setNewRole}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USER">User</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => selectedUser && updateUserRole(selectedUser.id, newRole)}
                              className="glow-effect hover:scale-105 transition-all duration-300"
                            >
                              Update Role
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            className="hover:scale-105 transition-all duration-300"
                          >
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl flex items-center gap-2">
                              <AlertCircle className="h-5 w-5 text-destructive" />
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              This action cannot be undone. This will permanently delete the user
                              account for <span className="font-semibold gradient-text">{user.username}</span> and remove all associated data.
                              <br />
                              <br />
                              <span className="text-sm font-medium">User Details:</span>
                              <br />
                              • Email: {user.email}
                              <br />
                              • Plan: {planNames[user.plan]}
                              <br />
                              • Tokens: {user.tokens.toLocaleString()}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUser(user.id)}
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            >
                              Delete User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
              {sortedUsers.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-foreground text-lg font-medium mb-2">No users found</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Try adjusting your search terms or filter settings to find the users you're looking for.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}