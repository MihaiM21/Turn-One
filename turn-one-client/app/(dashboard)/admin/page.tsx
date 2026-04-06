'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Users, Crown, Shield, TrendingUp, Download, Filter, MoreHorizontal, Calendar, Activity, AlertCircle, RefreshCw, Mail, CheckCircle2, XCircle, Trash2, UserPlus, Zap, Send, FileText, Plus, Trophy, Brain, Bell, Loader2, Image as ImageIcon, ArrowRight, Coins, type LucideIcon } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import * as adminService from '@/lib/adminService';
import * as userService from '@/lib/userService';
import { OnlineUsersWidget } from '@/components/dashboard/online-users-widget';

interface User {
  id: string;
  email: string;
  username: string;
  role: number;
  plan: 'BASIC' | 'PRO' | 'ELITE';
  tokens: number;
  coins: number;
  createdAt: string;
  lastLogin?: string;
  lastTokenRefillDate?: string;
}

interface CurrentUser {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'CONTENT_CREATOR' | 'ADMIN';
  plan: 'BASIC' | 'PRO' | 'ELITE';
  tokens: number;
  coins: number;
}

const planNames: Record<string, string> = {
  BASIC: '0 - Basic',
  PRO: '1 - Pro',
  ELITE: '2 - Elite',
  '0': 'Basic',
  '1': 'Pro', 
  '2': 'Elite',
};

const roleNames: Record<string, string> = {
  USER: 'User',
  CONTENT_CREATOR: 'Content Creator',
  ADMIN: 'Admin',
  '0': 'User',
  '1': 'Content Creator',
  '2': 'Admin',
}

const planColors: Record<string, string> = {
  BASIC: 'bg-muted text-muted-foreground',
  PRO: 'bg-primary/10 text-primary',
  ELITE: 'bg-accent/10 text-accent',
  CONTENT_CREATOR: 'bg-primary/20 text-primary',
  '0': 'bg-muted text-muted-foreground',
  '1': 'bg-primary/10 text-primary',
  '2': 'bg-accent/10 text-accent',
  '3': 'bg-primary/20 text-primary'
};

// Helper function to convert numeric role to string format
const getRoleString = (role: number | string): string => {
  const numRole = typeof role === 'string' ? parseInt(role) : role;
  switch(numRole) {
    case 0: return 'USER';
    case 1: return 'CONTENT_CREATOR';
    case 2: return 'ADMIN';
    default: return 'USER';
  }
};

// Helper function to convert string role to numeric format
const getRoleNumber = (role: string): number => {
  switch(role) {
    case 'USER': return 0;
    case 'CONTENT_CREATOR': return 1;
    case 'ADMIN': return 2;
    default: return 0;
  }
};

// Helper function to convert numeric plan to string format
const getPlanString = (plan: number | string): string => {
  const numPlan = typeof plan === 'string' ? parseInt(plan) : plan;
  switch(numPlan) {
    case 0: return 'BASIC';
    case 1: return 'PRO';
    case 2: return 'ELITE';
    default: return 'BASIC';
  }
};

// Helper function to convert string plan to numeric format
const getPlanNumber = (plan: string): number => {
  switch(plan) {
    case 'BASIC': return 0;
    case 'PRO': return 1;
    case 'ELITE': return 2;
    default: return 0;
  }
};



export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editType, setEditType] = useState<'tokens' | 'coins' | 'plan' | 'role' | 'email' | null>(null);
  const [newPlan, setNewPlan] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailMessage, setEmailMessage] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('');
  const [newTokens, setNewTokens] = useState<number>(0);
  const [newCoins, setNewCoins] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState('all');
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await userService.fetchUserProfile(token || '');
    setCurrentUser(response);
  };

  const fetchUsers = async () => {
    const result = await adminService.fetchUsers();
    
    if (result.success) {
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
    const result = await adminService.updateUserPlan(userId, planType);
    
    if (result.success) {
      toast({
        title: "Success",
        description: "User plan updated successfully.",
      });
      fetchUsers();
      setSelectedUser(null);
      setEditType(null);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const updateUserTokens = async (userId: string, tokens: number) => {
    const result = await adminService.updateUserTokens(userId, tokens);
    if (result.success) {
      toast({
        title: "Success",
        description: "User tokens updated successfully.",
      });
      fetchUsers();
      setSelectedUser(null);
      setEditType(null);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const updateUserCoins = async (userId: string, coins: number) => {
    const result = await adminService.updateUserCoins(userId, coins);
    if (result.success) {
      toast({
        title: "Success",
        description: "User coins updated successfully.",
      });
      fetchUsers();
      setSelectedUser(null);
      setEditType(null);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    let result;
    switch(role) {
      case 'USER':
        result = await adminService.updateUserRole(userId, 0);
        break;
      case 'CONTENT_CREATOR':
        result = await adminService.updateUserRole(userId, 1);
        break;
      case 'ADMIN':
        result = await adminService.updateUserRole(userId, 2);
        break;
      default:
        result = await adminService.updateUserRole(userId, 0);
    }
    
    if (result.success) {
      toast({
        title: "Success",
        description: "User role updated successfully.",
      });
      fetchUsers();
      setSelectedUser(null);
      setEditType(null);
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
      setSelectedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map(u => u.id)));
    }
  };

  const handleBulkDelete = async () => {
    const userIds = Array.from(selectedUsers);
    let successCount = 0;
    let errorCount = 0;

    for (const userId of userIds) {
      const result = await adminService.deleteUser(userId);
      if (result.success) successCount++;
      else errorCount++;
    }

    toast({
      title: successCount > 0 ? "Bulk Delete Complete" : "Bulk Delete Failed",
      description: `Successfully deleted ${successCount} user(s). ${errorCount > 0 ? `Failed: ${errorCount}` : ''}`,
      variant: errorCount > 0 ? "destructive" : "default",
    });

    fetchUsers();
    setSelectedUsers(new Set());
  };

  const exportUsers = () => {
    const csvContent = [
      ['Username', 'Email', 'Role', 'Plan', 'Tokens', 'Coins', 'Created At'],
      ...filteredUsers.map(u => [
        u.username,
        u.email,
        roleNames[u.role],
        planNames[u.plan],
        u.tokens,
        u.coins,
        new Date(u.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredUsers.length} users to CSV.`,
    });
  };

  const sendEmail = async (userId: string, subject: string, message: string) => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide both subject and message.",
        variant: "destructive",
      });
      return;
    }

    // Simulate sending email - replace with actual API call
    toast({
      title: "Email Sent Successfully",
      description: `Email sent to ${selectedUser?.email}`,
    });
    
    setSelectedUser(null);
    setEditType(null);
    setEmailSubject('');
    setEmailMessage('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalUsers = users.length;
  const adminCount = users.filter(user => user.role === 2).length;
  const contentCreatorCount = users.filter(user => user.role === 1).length;
  const totalTokens = users.reduce((sum, user) => sum + user.tokens, 0);
  const totalCoins = users.reduce((sum, user) => sum + user.coins, 0);
  const normalizePlan = (plan: string | number): string => {
    const p = String(plan);
    if (p === '0') return 'BASIC';
    if (p === '1') return 'PRO';
    if (p === '2') return 'ELITE';
    return p;
  };
  const planDistribution = users.reduce((acc, user) => {
    const key = normalizePlan(user.plan);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const recentUsers = users.filter(u => 
    new Date(u.createdAt) > new Date(Date.now() - 7*24*60*60*1000)
  ).length;
  
  const activeUsers = users.filter(u => 
    u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 7*24*60*60*1000)
  ).length;

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === getRoleNumber(roleFilter);
    const matchesPlan = planFilter === 'ALL' || user.plan === planFilter;
    
    // Tab filtering
    let matchesTab = true;
    if (activeTab === 'active') {
      matchesTab = !!user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 7*24*60*60*1000);
    } else if (activeTab === 'inactive') {
      matchesTab = !user.lastLogin || new Date(user.lastLogin) <= new Date(Date.now() - 7*24*60*60*1000);
    } else if (activeTab === 'new') {
      matchesTab = new Date(user.createdAt) > new Date(Date.now() - 7*24*60*60*1000);
    }
    
    return matchesSearch && matchesRole && matchesPlan && matchesTab;
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

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + itemsPerPage);

  const primaryStats: Array<{
    label: string;
    value: string | number;
    helper: string;
    icon: LucideIcon;
    wrapperClass: string;
    iconClass: string;
    valueClass: string;
  }> = [
    {
      label: 'Total Users',
      value: totalUsers,
      helper: `${recentUsers} new this week`,
      icon: Users,
      wrapperClass: 'border-primary/25 bg-gradient-to-br from-card to-primary/5',
      iconClass: 'bg-primary/10 text-primary',
      valueClass: 'from-primary to-accent',
    },
    {
      label: 'Admin Users',
      value: adminCount,
      helper: `${totalUsers > 0 ? ((adminCount / totalUsers) * 100).toFixed(1) : 0}% of users`,
      icon: Shield,
      wrapperClass: 'border-accent/25 bg-gradient-to-br from-card to-accent/5',
      iconClass: 'bg-accent/10 text-accent',
      valueClass: 'from-accent to-accent/70',
    },
    {
      label: 'Total Tokens',
      value: totalTokens.toLocaleString(),
      helper: `Avg ${totalUsers ? Math.round(totalTokens / totalUsers).toLocaleString() : 0} per user`,
      icon: TrendingUp,
      wrapperClass: 'border-primary/25 bg-gradient-to-br from-card to-primary/5',
      iconClass: 'bg-primary/10 text-primary',
      valueClass: 'from-primary to-primary/70',
    },
    {
      label: 'Active (7d)',
      value: activeUsers,
      helper: `${totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0}% activity`,
      icon: Activity,
      wrapperClass: 'border-green-500/25 bg-gradient-to-br from-card to-green-500/5',
      iconClass: 'bg-green-500/10 text-green-500',
      valueClass: 'from-green-500 to-green-400',
    },
  ];

  const quickActionItems: Array<{
    href: string;
    label: string;
    icon: LucideIcon;
    borderClass: string;
    bgClass: string;
    iconClass: string;
    hoverClass: string;
  }> = [
    {
      href: '/admin/media',
      label: 'Media',
      icon: ImageIcon,
      borderClass: 'border-cyan-500/25',
      bgClass: 'from-card to-cyan-500/5',
      iconClass: 'bg-cyan-500/10 text-cyan-400',
      hoverClass: 'group-hover:text-cyan-400',
    },
    {
      href: '/admin/predictions',
      label: 'Predictions',
      icon: Trophy,
      borderClass: 'border-yellow-500/25',
      bgClass: 'from-card to-yellow-500/5',
      iconClass: 'bg-yellow-500/10 text-yellow-400',
      hoverClass: 'group-hover:text-yellow-400',
    },
    {
      href: '/admin/trivia',
      label: 'Trivia',
      icon: Brain,
      borderClass: 'border-purple-500/25',
      bgClass: 'from-card to-purple-500/5',
      iconClass: 'bg-purple-500/10 text-purple-400',
      hoverClass: 'group-hover:text-purple-400',
    },
    {
      href: '/admin/notifications',
      label: 'Notifications',
      icon: Bell,
      borderClass: 'border-orange-500/25',
      bgClass: 'from-card to-orange-500/5',
      iconClass: 'bg-orange-500/10 text-orange-400',
      hoverClass: 'group-hover:text-orange-400',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black">
      <div className="container mx-auto px-3 py-4 md:px-4 md:py-5">
        {/* Header Section */}
        <div className="mb-3">
          <div className="modern-gradient rounded-xl p-3 md:p-4 shadow-md border border-primary/20 hover:border-primary/35 transition-all duration-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">Admin Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Manage users, plans, and system administration</p>
                </div>
              </div>
              {currentUser && (
                <div className="flex items-center gap-3">
                  <OnlineUsersWidget />
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm glow-effect">
                      {currentUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{currentUser.username}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compact Overview */}
        <Card className="mb-2.5 border-transparent bg-transparent">
          <CardContent className="p-0">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
              {primaryStats.map((stat) => {
                const StatIcon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className={`rounded-lg border ${stat.wrapperClass} px-2.5 py-2 transition-colors hover:border-primary/45`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-muted-foreground truncate">{stat.label}</p>
                        <p className={`text-lg md:text-xl font-bold bg-gradient-to-r ${stat.valueClass} bg-clip-text text-transparent`}>
                          {stat.value}
                        </p>
                      </div>
                      <div className={`h-6 w-6 rounded-md flex items-center justify-center ${stat.iconClass}`}>
                        <StatIcon className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{stat.helper}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Strip */}
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1.5">
            {quickActionItems.map((action) => {
              const ActionIcon = action.icon;
              return (
                <Link key={action.href} href={action.href} className="group">
                  <div
                    className={`h-full rounded-lg border ${action.borderClass} bg-gradient-to-br ${action.bgClass} px-2 py-2 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${action.iconClass}`}>
                        <ActionIcon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-medium text-foreground truncate">{action.label}</span>
                      <ArrowRight className={`ml-auto h-3 w-3 text-muted-foreground transition-all group-hover:translate-x-0.5 ${action.hoverClass}`} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-3">
          <Card className="border-border/50 hover:border-primary/30 transition-all duration-200 bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">New (7d)</p>
                  <p className="text-base md:text-lg font-semibold text-foreground">{recentUsers}</p>
                </div>
                <UserPlus className="h-3.5 w-3.5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-accent/30 transition-all duration-200 bg-gradient-to-br from-card to-accent/5">
            <CardContent className="p-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Creators</p>
                  <p className="text-base md:text-lg font-semibold text-foreground">{contentCreatorCount}</p>
                </div>
                <Crown className="h-3.5 w-3.5 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-yellow-500/30 transition-all duration-200 bg-gradient-to-br from-card to-yellow-500/5">
            <CardContent className="p-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Coins</p>
                  <p className="text-base md:text-lg font-semibold text-foreground">{totalCoins.toLocaleString()}</p>
                </div>
                <Coins className="h-3.5 w-3.5 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-accent/30 transition-all duration-200 bg-gradient-to-br from-card to-accent/5">
            <CardContent className="p-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Elite</p>
                  <p className="text-base md:text-lg font-semibold text-foreground">{planDistribution.ELITE || 0}</p>
                </div>
                <Crown className="h-3.5 w-3.5 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/30 transition-all duration-200 bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Pro</p>
                  <p className="text-base md:text-lg font-semibold text-foreground">{planDistribution.PRO || 0}</p>
                </div>
                <Crown className="h-3.5 w-3.5 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-5 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <CardTitle className="text-lg">User Management</CardTitle>
                <CardDescription>Search, filter, and manage user accounts</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchUsers()}
                  className="hover:scale-[1.02] transition-all duration-200"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportUsers}
                  className="accent-glow hover:scale-[1.02] transition-all duration-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
              <div className="relative md:col-span-2">
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
                  <SelectItem value="CONTENT_CREATOR">Content Creators</SelectItem>
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
            
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  Showing {paginatedUsers.length} of {sortedUsers.length} users
                  {sortedUsers.length !== totalUsers && ` (${totalUsers} total)`}
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

              <Select value={itemsPerPage.toString()} onValueChange={(val) => {
                setItemsPerPage(Number(val));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions Bar */}
            {selectedUsers.size > 0 && (
              <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground">
                    {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedUsers(new Set())}
                  >
                    Clear Selection
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Multiple Users?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You are about to delete {selectedUsers.size} user(s). This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleBulkDelete}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">All Users</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Page {currentPage} of {totalPages} • {sortedUsers.length} user{sortedUsers.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="flex items-center gap-1.5 text-xs md:text-sm">
                  <Users className="h-4 w-4" />
                  All Users
                </TabsTrigger>
                <TabsTrigger value="active" className="flex items-center gap-1.5 text-xs md:text-sm">
                  <Activity className="h-4 w-4" />
                  Active
                </TabsTrigger>
                <TabsTrigger value="inactive" className="flex items-center gap-1.5 text-xs md:text-sm">
                  <XCircle className="h-4 w-4" />
                  Inactive
                </TabsTrigger>
                <TabsTrigger value="new" className="flex items-center gap-1.5 text-xs md:text-sm">
                  <UserPlus className="h-4 w-4" />
                  New (7d)
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-3">
              {paginatedUsers.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                  <Checkbox
                    checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                    onCheckedChange={handleSelectAll}
                    id="select-all"
                  />
                  <label 
                    htmlFor="select-all"
                    className="text-sm font-medium text-foreground cursor-pointer"
                  >
                    Select all {paginatedUsers.length} user{paginatedUsers.length !== 1 ? 's' : ''} on this page
                  </label>
                </div>
              )}

              {paginatedUsers.map((user) => (
                <div key={user.id} className={`bg-card rounded-xl p-4 border shadow-sm hover:shadow transition-colors duration-200 ${
                  selectedUsers.has(user.id) ? 'border-primary/50 bg-primary/5' : 'border-border/50 hover:border-primary/30'
                }`}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => handleSelectUser(user.id)}
                          id={`user-${user.id}`}
                        />
                        <div className="h-9 w-9 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h3 className="font-semibold text-foreground truncate">{user.username}</h3>
                            <Badge variant={user.role === 2 ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                              {roleNames[user.role] || user.role}
                            </Badge>
                            <Badge className={`${planColors[user.plan] || 'bg-muted text-muted-foreground'} text-[10px] shrink-0`}>
                              {planNames[user.plan] || user.plan}
                            </Badge>
                            {user.lastLogin ? (
                              <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" title="Active" />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-orange-500 shrink-0" title="Inactive" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-primary" />
                              {user.tokens.toLocaleString()} tokens
                            </span>
                            <span className="flex items-center gap-1">
                              <Coins className="h-3 w-3 text-yellow-500" />
                              {user.coins.toLocaleString()} coins
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                            {user.lastTokenRefillDate && (() => {
                              const nextRefill = new Date(user.lastTokenRefillDate);
                              nextRefill.setMonth(nextRefill.getMonth() + 1);
                              const daysLeft = Math.ceil((nextRefill.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                              const isOverdue = daysLeft <= 0;
                              const isSoon = daysLeft <= 3 && daysLeft > 0;
                              return (
                                <span className={`flex items-center gap-1 ${
                                  isOverdue ? 'text-red-400' : isSoon ? 'text-yellow-400' : 'text-muted-foreground'
                                }`}>
                                  <RefreshCw className="h-3 w-3" />
                                  Refill: {isOverdue ? 'Overdue' : isSoon ? `${daysLeft}d` : nextRefill.toLocaleDateString()}
                                </span>
                              );
                            })()}
                            {user.lastLogin && (
                              <span className="flex items-center gap-1">
                                <Activity className="h-3 w-3 text-green-500" />
                                Last: {new Date(user.lastLogin).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    

                    <div className="flex gap-2 shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <MoreHorizontal className="h-4 w-4" />
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setNewTokens(user.tokens);
                            setEditType('tokens');
                          }}>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Manage Tokens
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setNewCoins(user.coins);
                            setEditType('coins');
                          }}>
                            <Zap className="h-4 w-4 mr-2" />
                            Manage Coins
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setNewPlan(user.plan);
                            setEditType('plan');
                          }}>
                            <Crown className="h-4 w-4 mr-2" />
                            Change Plan
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setNewRole(getRoleString(user.role));
                            setEditType('role');
                          }}>
                            <Shield className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setEmailSubject('');
                            setEmailMessage('');
                            setEditType('email');
                          }} className="text-primary hover:text-primary/80 hover:bg-primary/10">
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
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
              
              {paginatedUsers.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-foreground text-lg font-medium mb-2">No users found</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Try adjusting your search terms or filter settings to find the users you&apos;re looking for.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedUsers.length)} of {sortedUsers.length} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialogs */}
      <Dialog open={editType === 'tokens'} onOpenChange={(open) => !open && setEditType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl gradient-text">Update User Tokens</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Change the token count for <span className="font-semibold">{selectedUser?.username}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Input
              type="number"
              min={0}
              value={newTokens}
              onChange={(e) => setNewTokens(parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => selectedUser && updateUserTokens(selectedUser.id, newTokens)}
              className="glow-effect hover:scale-105 transition-all duration-300"
            >
              Update Tokens
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editType === 'coins'} onOpenChange={(open) => !open && setEditType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl gradient-text">Update User Coins</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Change the coin count for <span className="font-semibold">{selectedUser?.username}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Input
              type="number"
              min={0}
              value={newCoins}
              onChange={(e) => setNewCoins(parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => selectedUser && updateUserCoins(selectedUser.id, newCoins)}
              className="glow-effect hover:scale-105 transition-all duration-300"
            >
              Update Coins
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editType === 'plan'} onOpenChange={(open) => !open && setEditType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl gradient-text">Update User Plan</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Change the subscription plan for <span className="font-semibold">{selectedUser?.username}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Select value={newPlan} onValueChange={setNewPlan}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BASIC">Basic</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
                <SelectItem value="ELITE">Elite</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              onClick={() => selectedUser && updateUserPlan(selectedUser.id, newPlan)}
              className="glow-effect hover:scale-105 transition-all duration-300"
              disabled={!newPlan || newPlan === selectedUser?.plan}
            >
              Update Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editType === 'role'} onOpenChange={(open) => !open && setEditType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl gradient-text">Update User Role</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Change the access role for <span className="font-semibold">{selectedUser?.username}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="CONTENT_CREATOR">Content Creator</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              onClick={() => selectedUser && updateUserRole(selectedUser.id, newRole)}
              className="glow-effect hover:scale-105 transition-all duration-300"
              disabled={!newRole}
            >
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={editType === 'email'} onOpenChange={(open) => !open && setEditType(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl gradient-text flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Email to User
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Send an email to <span className="font-semibold text-foreground">{selectedUser?.username}</span> ({selectedUser?.email})
              <br />
              <span className="text-xs text-orange-500 mt-1 block">
                Note: This will send an email directly to the user&apos;s inbox.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email-subject" className="text-sm font-medium">
                Subject *
              </Label>
              <Input
                id="email-subject"
                placeholder="Enter email subject..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-message" className="text-sm font-medium">
                Message *
              </Label>
              <Textarea
                id="email-message"
                placeholder="Enter your message..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                className="w-full min-h-[150px] resize-none"
              />
            </div>
            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Email will be sent from: admin@turnone.com
              </p>
              <p className="flex items-center gap-2 mt-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                User will receive this at: {selectedUser?.email}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditType(null);
                setEmailSubject('');
                setEmailMessage('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedUser && sendEmail(selectedUser.id, emailSubject, emailMessage)}
              className="glow-effect hover:scale-105 transition-all duration-300"
              disabled={!emailSubject.trim() || !emailMessage.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
