'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Bell, Plus, ArrowLeft, Send, Trash2, Users, Shield, Crown } from 'lucide-react';
import Link from 'next/link';
import { getAuthToken } from '@/lib/auth-utils';

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
  { value: 'INFO', label: 'Info', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { value: 'SUCCESS', label: 'Success', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  { value: 'WARNING', label: 'Warning', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  { value: 'ERROR', label: 'Error', color: 'bg-red-500/10 text-red-500 border-red-500/20' }
];

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
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
    }
  };

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

    setLoading(true);
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
          title: 'Success! 🎉',
          description: data.message || 'Notification sent successfully',
        });
        setDialogOpen(false);
        await loadNotifications();
      } else {
        throw new Error(data.message || 'Failed to send notification');
      }
    } catch (error: any) {
      console.error('Send error:', error);
      toast({
        title: 'Failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/Notification/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Deleted',
          description: 'Notification deleted successfully',
        });
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold">Notification Center</h1>
            <p className="text-muted-foreground mt-1">
              Create and send notifications to users
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            New Notification
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Sent</p>
              <p className="text-2xl font-bold">{notifications.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Info</p>
              <p className="text-2xl font-bold text-blue-500">
                {notifications.filter(n => n.type === 'INFO').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Success</p>
              <p className="text-2xl font-bold text-green-500">
                {notifications.filter(n => n.type === 'SUCCESS').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Warnings</p>
              <p className="text-2xl font-bold text-yellow-500">
                {notifications.filter(n => n.type === 'WARNING').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <div className="grid gap-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{notification.title}</h3>
                          <Badge variant="outline" className={getTypeColor(notification.type)}>
                            {notification.type}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Badge variant="outline" className="gap-1">
                            <Users className="w-3 h-3" />
                            {notification.targetAudience === 'ALL' && 'All Users'}
                            {notification.targetAudience === 'PLAN' && `Plans: ${notification.targetPlans}`}
                            {notification.targetAudience === 'ROLE' && `Roles: ${notification.targetRoles}`}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            by {notification.createdByUsername} • {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(notification.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create/Send Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send Notification</DialogTitle>
              <DialogDescription>
                Create and send a notification to users
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Notification title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Notification message..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                />
              </div>

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
                <div className="space-y-2">
                  <Label>Target Plans</Label>
                  <div className="flex gap-4">
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
                <div className="space-y-2">
                  <Label>Target Roles</Label>
                  <div className="flex gap-4">
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="gap-2">
                <Send className="w-4 h-4" />
                {loading ? 'Sending...' : 'Send Notification'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
