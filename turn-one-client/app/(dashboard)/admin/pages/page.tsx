'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Loader2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getPageStatus, updatePageStatus, type PageStatus } from '@/lib/pageStatusService';

export default function AdminPagesDashboard() {
  const [loading, setLoading] = useState(true);
  const [savingLive, setSavingLive] = useState(false);
  const [savingGenerator, setSavingGenerator] = useState(false);
  
  const [liveStatus, setLiveStatus] = useState<PageStatus>({ id: 0, pageName: '/live', isClosed: false, maintenanceMessage: '' });
  const [generatorStatus, setGeneratorStatus] = useState<PageStatus>({ id: 0, pageName: '/generator', isClosed: false, maintenanceMessage: '' });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      const [live, generator] = await Promise.all([
        getPageStatus('/live'),
        getPageStatus('/generator')
      ]);
      setLiveStatus(live);
      setGeneratorStatus(generator);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load page statuses.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLive = async () => {
    setSavingLive(true);
    try {
      await updatePageStatus('/live', liveStatus.isClosed, liveStatus.maintenanceMessage);
      toast({
        title: "Success",
        description: "Live page status updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update Live page status.",
        variant: "destructive",
      });
    } finally {
      setSavingLive(false);
    }
  };

  const handleSaveGenerator = async () => {
    setSavingGenerator(true);
    try {
      await updatePageStatus('/generator', generatorStatus.isClosed, generatorStatus.maintenanceMessage);
      toast({
        title: "Success",
        description: "Generator page status updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update Generator page status.",
        variant: "destructive",
      });
    } finally {
      setSavingGenerator(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Loading pages management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <div className="modern-gradient rounded-xl p-4 md:p-6 shadow-md border border-primary/20">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">Page Management</h1>
                <p className="text-muted-foreground mt-1">Control access to specific pages and set maintenance messages</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Live Page Settings */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-xl">Live Dashboard</CardTitle>
              <CardDescription>Manage the /live page availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Close Page</Label>
                  <p className="text-sm text-muted-foreground">When closed, users will see the maintenance message.</p>
                </div>
                <Switch
                  checked={liveStatus.isClosed}
                  onCheckedChange={(checked) => setLiveStatus({ ...liveStatus, isClosed: checked })}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="live-message">Maintenance Message</Label>
                <Textarea
                  id="live-message"
                  placeholder="e.g., We are currently updating our systems. Please check back later."
                  value={liveStatus.maintenanceMessage}
                  onChange={(e) => setLiveStatus({ ...liveStatus, maintenanceMessage: e.target.value })}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">This message will be shown when the page is closed.</p>
              </div>

              <Button 
                onClick={handleSaveLive} 
                disabled={savingLive}
                className="w-full"
              >
                {savingLive ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Live Settings
              </Button>
            </CardContent>
          </Card>

          {/* Generator Page Settings */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-xl">Telemetry Generator</CardTitle>
              <CardDescription>Manage the /generator page availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Close Page</Label>
                  <p className="text-sm text-muted-foreground">When closed, users will see the maintenance message.</p>
                </div>
                <Switch
                  checked={generatorStatus.isClosed}
                  onCheckedChange={(checked) => setGeneratorStatus({ ...generatorStatus, isClosed: checked })}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="generator-message">Maintenance Message</Label>
                <Textarea
                  id="generator-message"
                  placeholder="e.g., The telemetry generator is currently down for upgrades."
                  value={generatorStatus.maintenanceMessage}
                  onChange={(e) => setGeneratorStatus({ ...generatorStatus, maintenanceMessage: e.target.value })}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">This message will be shown when the page is closed.</p>
              </div>

              <Button 
                onClick={handleSaveGenerator} 
                disabled={savingGenerator}
                className="w-full"
              >
                {savingGenerator ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Generator Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
