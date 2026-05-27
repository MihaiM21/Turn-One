'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Bell, Plus, ArrowLeft, Send, Trash2, Users, Shield, Crown,
  Loader2, Search, Filter, Info, CheckCircle2, AlertTriangle,
  XCircle, Clock, Megaphone, Target
} from 'lucide-react';
import Link from 'next/link';
import { getAuthToken } from '@/lib/auth-utils';
import { DashboardHeader } from '@/components/dashboard/live dashboard/dashboard-header';
import { PageHeader } from '@/components/dashboard/page-header';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  targetAudience: string;
  targetPlans: string | null;
  targetRoles: string | null;
  createdAt: string;
  createdByUsername: string;
}

const notificationTypes = [
  { value: 'INFO', label: 'Info', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Info },
  { value: 'SUCCESS', label: 'Success', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 },
  { value: 'WARNING', label: 'Warning', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: AlertTriangle },
  { value: 'ERROR', label: 'Error', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle }
];

const typeColors: Record<string, { bg: string; border: string; text: string; iconColor: string }> = {
  INFO: { bg: 'from-card to-blue-500/5', border: 'border-blue-500/20 hover:border-blue-500/40', text: 'text-blue-400', iconColor: 'bg-blue-500/10' },
  SUCCESS: { bg: 'from-card to-green-500/5', border: 'border-green-500/20 hover:border-green-500/40', text: 'text-green-400', iconColor: 'bg-green-500/10' },
  WARNING: { bg: 'from-card to-yellow-500/5', border: 'border-yellow-500/20 hover:border-yellow-500/40', text: 'text-yellow-400', iconColor: 'bg-yellow-500/10' },
  ERROR: { bg: 'from-card to-red-500/5', border: 'border-red-500/20 hover:border-red-500/40', text: 'text-red-400', iconColor: 'bg-red-500/10' },
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'INFO',
    targetAudience: 'ALL',
    targetPlans: [] as string[],
    targetRoles: [] as string[]
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/Notification/all`, {
        headers: { 'Authorization': token },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const info = notifications.filter(n => n.type === 'INFO').length;
    const success = notifications.filter(n => n.type === 'SUCCESS').length;
    const warning = notifications.filter(n => n.type === 'WARNING').length;
    const error = notifications.filter(n => n.type === 'ERROR').length;
    const allUsers = notifications.filter(n => n.targetAudience === 'ALL').length;
    const targeted = notifications.length - allUsers;
    return { info, success, warning, error, allUsers, targeted };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchesSearch = !searchTerm ||
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'all' || n.type === activeTab.toUpperCase();
      return matchesSearch && matchesTab;
    });
  }, [notifications, searchTerm, activeTab]);

  const handleCreate = () => {
    setFormData({
      title: '',
      message: '',
      type: 'INFO',
      targetAudience: 'ALL',
      targetPlans: [],
      targetRoles: []
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.message) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in title and message',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const payload = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        targetAudience: formData.targetAudience,
        targetPlans: formData.targetAudience === 'PLAN' && formData.targetPlans.length > 0 ? formData.targetPlans : null,
        targetRoles: formData.targetAudience === 'ROLE' && formData.targetRoles.length > 0 ? formData.targetRoles : null
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/Notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create notification');
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: data.message || 'Notification sent successfully',
        });
        setDialogOpen(false);
        await loadNotifications();
      } else {
        throw new Error(data.message || 'Failed to send notification');
      }
    } catch (error: any) {
      toast({
        title: 'Failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (notification: Notification) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/Notification/${notification.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Deleted',
          description: 'Notification deleted successfully',
        });
        setDeleteTarget(null);
        await loadNotifications();
      } else {
        throw new Error(data.message || 'Failed to delete');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  const getTypeColor = (type: string) => {
    return notificationTypes.find(t => t.value === type)?.color || notificationTypes[0].color;
  };

  const getTypeIcon = (type: string) => {
    const found = notificationTypes.find(t => t.value === type);
    return found ? found.icon : Info;
  };

  const togglePlan = (plan: string) => {
    setFormData(prev => ({
      ...prev,
      targetPlans: prev.targetPlans.includes(plan)
        ? prev.targetPlans.filter(p => p !== plan)
        : [...prev.targetPlans, plan]
    }));
  };

  const toggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role]
    }));
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <DashboardHeader />
        <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="flex items-center justify-center border border-zinc-800 bg-zinc-950 px-5 py-12 text-sm text-zinc-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading notifications...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <DashboardHeader />
      <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6 space-y-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to admin
        </Link>

        <PageHeader
          label="Admin · Notifications"
          title="Notification center"
          description="Create and broadcast notifications to your users."
          actions={
            <Button
              onClick={handleCreate}
              size="sm"
              className="rounded-sm bg-primary text-xs font-semibold uppercase tracking-wider text-white hover:bg-primary/90"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New notification
            </Button>
          }
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Total sent</p>
                <p className="mt-1 font-mono text-2xl font-black tabular-nums leading-none text-orange-400">
                  {notifications.length}
                </p>
              </div>
              <Bell className="h-4 w-4 shrink-0 text-orange-400" />
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">
              <span className="font-mono tabular-nums">{stats.allUsers}</span> broadcast ·{' '}
              <span className="font-mono tabular-nums">{stats.targeted}</span> targeted
            </p>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Info</p>
                <p className="mt-1 font-mono text-2xl font-black tabular-nums leading-none text-blue-400">{stats.info}</p>
              </div>
              <Info className="h-4 w-4 shrink-0 text-blue-400" />
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">informational</p>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Success</p>
                <p className="mt-1 font-mono text-2xl font-black tabular-nums leading-none text-green-400">{stats.success}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">positive updates</p>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Warnings & errors</p>
                <p className="mt-1 font-mono text-2xl font-black tabular-nums leading-none text-yellow-400">
                  {stats.warning + stats.error}
                </p>
              </div>
              <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-400" />
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">
              <span className="font-mono tabular-nums">{stats.warning}</span> warn ·{' '}
              <span className="font-mono tabular-nums">{stats.error}</span> error
            </p>
          </div>
        </div>

        {/* Filters & Search */}
        <Card className="mb-6 border-border/50">
          <CardContent className="p-5">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications by title or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="mt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all" className="gap-2">
                    <Bell className="h-4 w-4" />
                    All ({notifications.length})
                  </TabsTrigger>
                  <TabsTrigger value="info" className="gap-2">
                    <Info className="h-4 w-4" />
                    Info ({stats.info})
                  </TabsTrigger>
                  <TabsTrigger value="success" className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Success ({stats.success})
                  </TabsTrigger>
                  <TabsTrigger value="warning" className="gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Warning ({stats.warning})
                  </TabsTrigger>
                  <TabsTrigger value="error" className="gap-2">
                    <XCircle className="h-4 w-4" />
                    Error ({stats.error})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {searchTerm && (
              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                <Filter className="h-3 w-3" />
                Showing {filteredNotifications.length} of {notifications.length} notifications
                <Badge variant="secondary" className="text-xs">Search: {searchTerm}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-16 text-center">
                <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No notifications found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                  {searchTerm
                    ? 'Try adjusting your search terms.'
                    : 'Send your first notification to get started.'}
                </p>
                {notifications.length === 0 && (
                  <Button onClick={handleCreate} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Send First Notification
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => {
              const colors = typeColors[notification.type] || typeColors.INFO;
              const TypeIcon = getTypeIcon(notification.type);

              return (
                <Card key={notification.id} className={`${colors.border} hover:shadow-lg transition-all duration-300 bg-gradient-to-br ${colors.bg} group`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 h-10 w-10 ${colors.iconColor} rounded-xl flex items-center justify-center mt-0.5`}>
                            <TypeIcon className={`w-5 h-5 ${colors.text}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <h3 className="font-semibold text-lg">{notification.title}</h3>
                              <Badge variant="outline" className={getTypeColor(notification.type)}>
                                {notification.type}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">{notification.message}</p>

                            <Separator className="my-3 opacity-50" />

                            <div className="flex items-center gap-3 flex-wrap text-sm">
                              <Badge variant="outline" className="gap-1.5">
                                <Target className="w-3 h-3" />
                                {notification.targetAudience === 'ALL' && 'All Users'}
                                {notification.targetAudience === 'PLAN' && `Plans: ${notification.targetPlans}`}
                                {notification.targetAudience === 'ROLE' && `Roles: ${notification.targetRoles}`}
                              </Badge>
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <Users className="w-3 h-3" />
                                {notification.createdByUsername}
                              </span>
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(notification)}
                        className="opacity-60 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Delete Notification?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this notification.
                <div className="mt-3 p-3 bg-muted/30 rounded-lg border text-sm">
                  <p className="font-medium text-foreground">{deleteTarget?.title}</p>
                  <p className="text-muted-foreground mt-1 line-clamp-2">{deleteTarget?.message}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className={getTypeColor(deleteTarget?.type || '')}>
                      {deleteTarget?.type}
                    </Badge>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteTarget && handleDelete(deleteTarget)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create/Send Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Megaphone className="h-5 w-5 text-orange-400" />
                Send Notification
              </DialogTitle>
              <DialogDescription>
                Create and broadcast a notification to your users
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                <Input
                  id="title"
                  placeholder="Notification title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Notification message..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {notificationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select value={formData.targetAudience} onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Users</SelectItem>
                      <SelectItem value="PLAN">Specific Plans</SelectItem>
                      <SelectItem value="ROLE">Specific Roles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.targetAudience === 'PLAN' && (
                <div className="space-y-2 p-4 bg-muted/20 rounded-lg border">
                  <Label>Target Plans</Label>
                  <div className="flex gap-6 mt-2">
                    {['BASIC', 'PRO', 'ELITE'].map((plan) => (
                      <div key={plan} className="flex items-center space-x-2">
                        <Checkbox
                          id={plan}
                          checked={formData.targetPlans.includes(plan)}
                          onCheckedChange={() => togglePlan(plan)}
                        />
                        <label htmlFor={plan} className="text-sm font-medium cursor-pointer">
                          {plan}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.targetAudience === 'ROLE' && (
                <div className="space-y-2 p-4 bg-muted/20 rounded-lg border">
                  <Label>Target Roles</Label>
                  <div className="flex gap-6 mt-2">
                    {['USER', 'CONTENT_CREATOR', 'ADMIN'].map((role) => (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox
                          id={role}
                          checked={formData.targetRoles.includes(role)}
                          onCheckedChange={() => toggleRole(role)}
                        />
                        <label htmlFor={role} className="text-sm font-medium cursor-pointer">
                          {role.replace('_', ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              {formData.title && formData.message && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Preview</Label>
                    <div className={`p-4 rounded-lg border ${getTypeColor(formData.type)}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={getTypeColor(formData.type)}>{formData.type}</Badge>
                        <span className="font-semibold">{formData.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{formData.message}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={sending} className="gap-2 bg-orange-600 hover:bg-orange-700">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Sending...' : 'Send Notification'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
