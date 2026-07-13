'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Zap, Activity, Timer, Trash2, Loader2, Save, Users2, BarChart3,
  Check, ChevronsUpDown, Search, Filter, Clock,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/live dashboard/dashboard-header';
import { PageHeader } from '@/components/dashboard/page-header';
import * as adminService from '@/lib/adminService';
import type {
  TelemetryUsagePoint, TelemetryRequest, TelemetryUsageSummary, TelemetryLogSettings,
} from '@/lib/adminService';

const RANGES: Record<string, { days: number; bucket: string; label: string }> = {
  '7d': { days: 7, bucket: 'day', label: 'Last 7 days' },
  '30d': { days: 30, bucket: 'day', label: 'Last 30 days' },
  '90d': { days: 90, bucket: 'week', label: 'Last 90 days' },
  '365d': { days: 365, bucket: 'month', label: 'Last 12 months' },
};

const PAGE_SIZE = 25;

interface AdminUser {
  id: string;
  username: string;
}

export default function AdminUsagePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [rangeKey, setRangeKey] = useState('30d');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userPickerOpen, setUserPickerOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [series, setSeries] = useState<TelemetryUsagePoint[]>([]);
  const [summary, setSummary] = useState<TelemetryUsageSummary | null>(null);
  const [requests, setRequests] = useState<TelemetryRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  const [settings, setSettings] = useState<TelemetryLogSettings | null>(null);
  const [retentionInput, setRetentionInput] = useState(90);
  const [autoDeleteInput, setAutoDeleteInput] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<TelemetryRequest | null>(null);

  const range = RANGES[rangeKey];

  const rangeBounds = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - range.days);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [range.days]);

  const userIdParam = userFilter === 'all' ? undefined : userFilter;
  const selectedUsername = userFilter === 'all'
    ? 'All users'
    : users.find((u) => u.id === userFilter)?.username ?? 'All users';

  // ── Access gate + user list ────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const result = await adminService.checkAdminAccess();
      if (!result.success) {
        if (result.error === 'No token found') {
          router.push('/auth/login');
          return;
        }
        toast({
          title: 'Access Denied',
          description: result.error === 'Not admin' ? "You don't have admin privileges." : 'Failed to verify admin access.',
          variant: 'destructive',
        });
        router.push('/dashboard');
        return;
      }
      const usersResult = await adminService.fetchUsers();
      if (usersResult.success && Array.isArray(usersResult.data)) {
        setUsers(usersResult.data.map((u: any) => ({ id: u.id, username: u.username })));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load analytics (series + summary + requests) ───────────────────────
  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    const [seriesRes, summaryRes, requestsRes] = await Promise.all([
      adminService.fetchTelemetryUsageSeries({ ...rangeBounds, bucket: range.bucket, userId: userIdParam }),
      adminService.fetchTelemetryUsageSummary({ ...rangeBounds, userId: userIdParam }),
      adminService.fetchTelemetryRequests({ ...rangeBounds, userId: userIdParam, page, pageSize: PAGE_SIZE, search: debouncedSearch }),
    ]);
    if (seriesRes.success && seriesRes.data) setSeries(seriesRes.data);
    if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data);
    if (requestsRes.success && requestsRes.data) {
      setRequests(requestsRes.data.items);
      setTotalCount(requestsRes.data.totalCount);
    }
    setLoading(false);
  }, [rangeBounds, range.bucket, userIdParam, page, debouncedSearch]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset to first page whenever the filters change.
  useEffect(() => {
    setPage(1);
  }, [rangeKey, userFilter, debouncedSearch]);

  // ── Retention settings ─────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const res = await adminService.fetchTelemetryLogSettings();
      if (res.success && res.data) {
        setSettings(res.data);
        setRetentionInput(res.data.retentionDays);
        setAutoDeleteInput(res.data.autoDeleteEnabled);
      }
    })();
  }, []);

  const saveSettings = async () => {
    setSavingSettings(true);
    const res = await adminService.updateTelemetryLogSettings(retentionInput, autoDeleteInput);
    setSavingSettings(false);
    if (res.success && res.data) {
      setSettings(res.data);
      toast({ title: 'Settings saved', description: 'Retention configuration updated.' });
    } else {
      toast({ title: 'Error', description: res.error ?? 'Failed to save settings', variant: 'destructive' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await adminService.deleteTelemetryRequest(deleteTarget.id);
    setDeleteTarget(null);
    if (res.success) {
      toast({ title: 'Deleted', description: 'Request log removed.' });
      loadAnalytics();
    } else {
      toast({ title: 'Error', description: res.error ?? 'Failed to delete', variant: 'destructive' });
    }
  };

  const chartData = useMemo(
    () => series.map((p) => ({
      label: formatBucketLabel(p.periodStart, range.bucket),
      tokens: p.tokensUsed,
      requests: p.requestCount,
    })),
    [series, range.bucket],
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-black">
      <DashboardHeader />
      <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6 space-y-4">
        <PageHeader
          label="Admin"
          title="Token Usage"
          description="Telemetry generation activity — tokens spent, requests, and return times."
          stats={[
            { icon: Zap, label: 'Tokens', value: summary?.totalTokensUsed ?? 0, iconClassName: 'text-yellow-400' },
            { icon: Activity, label: 'Requests', value: summary?.totalRequests ?? 0, iconClassName: 'text-primary' },
            { icon: Timer, label: 'Avg ms', value: summary ? Math.round(summary.averageDurationMs) : 0, iconClassName: 'text-green-400' },
          ]}
          actions={
            <Link href="/admin">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            </Link>
          }
        />

        {/* Filters */}
        <section className="border border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-3">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Filters</p>
          </div>
          <div className="flex flex-wrap items-end gap-3 px-5 py-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Time period</Label>
              <Select value={rangeKey} onValueChange={setRangeKey}>
                <SelectTrigger className="w-[180px] bg-zinc-900/60 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RANGES).map(([key, r]) => (
                    <SelectItem key={key} value={key}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">User</Label>
              <Popover open={userPickerOpen} onOpenChange={setUserPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={userPickerOpen}
                    className="w-[240px] justify-between bg-zinc-900/60 border-zinc-800 font-normal"
                  >
                    <span className="truncate">{selectedUsername}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search users..." />
                    <CommandList>
                      <CommandEmpty>No user found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All users"
                          onSelect={() => { setUserFilter('all'); setUserPickerOpen(false); }}
                        >
                          <Check className={`mr-2 h-4 w-4 ${userFilter === 'all' ? 'opacity-100' : 'opacity-0'}`} />
                          All users
                        </CommandItem>
                        {users.map((u) => (
                          <CommandItem
                            key={u.id}
                            value={u.username}
                            onSelect={() => { setUserFilter(u.id); setUserPickerOpen(false); }}
                          >
                            <Check className={`mr-2 h-4 w-4 ${userFilter === u.id ? 'opacity-100' : 'opacity-0'}`} />
                            {u.username}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="min-w-[240px] flex-1 space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Search requests</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  placeholder="Search by user, plot type, event, session or driver..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-zinc-900/60 border-zinc-800"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Usage chart */}
        <section className="border border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-3">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Tokens used over time</p>
          </div>
          <div className="px-5 py-4">
            {loading ? (
              <div className="flex h-[300px] items-center justify-center text-zinc-500">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-zinc-500">
                No usage in this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tokensFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{ background: '#09090b', border: '1px solid #27272a', fontSize: 12 }}
                    labelStyle={{ color: '#e4e4e7' }}
                  />
                  <Area type="monotone" dataKey="tokens" name="Tokens" stroke="#eab308" fill="url(#tokensFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Summary breakdowns */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="border border-zinc-800 bg-zinc-950">
            <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-3">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Top plot types</p>
            </div>
            <div className="px-5 py-4">
              <BreakdownList items={summary?.topPlotTypes ?? []} unit="requests" />
            </div>
          </section>
          <section className="border border-zinc-800 bg-zinc-950">
            <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-3">
              <Users2 className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Top users by tokens</p>
            </div>
            <div className="px-5 py-4">
              <BreakdownList items={summary?.topUsers ?? []} unit="tokens" />
            </div>
          </section>
        </div>

        {/* Request log */}
        <section className="border border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Generation requests</p>
            </div>
            <span className="font-mono text-[11px] tabular-nums text-zinc-500">
              {debouncedSearch ? `${totalCount} matching “${debouncedSearch}”` : `${totalCount} total`}
            </span>
          </div>
          <div className="px-5 py-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead>User</TableHead>
                    <TableHead>Plot</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Drivers</TableHead>
                    <TableHead className="text-right">Return</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-zinc-500 py-8">
                        {debouncedSearch ? `No requests match “${debouncedSearch}”.` : 'No requests in this period.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((r) => (
                      <TableRow key={r.id} className="border-zinc-800">
                        <TableCell className="font-medium">{r.username}</TableCell>
                        <TableCell><span className="font-mono text-xs">{r.plotType}</span></TableCell>
                        <TableCell className="text-xs text-zinc-400">{r.year} · {r.eventName} · {r.session}</TableCell>
                        <TableCell className="text-xs text-zinc-400">{r.drivers ?? '—'}</TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums">{r.durationMs} ms</TableCell>
                        <TableCell>
                          {r.success ? (
                            <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10">ok</Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10" title={r.errorMessage ?? undefined}>failed</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-zinc-400">{new Date(r.createdAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-zinc-500 hover:text-red-400"
                            onClick={() => setDeleteTarget(r)}
                            aria-label="Delete log entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Retention settings */}
        <section className="border border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-3">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Automatic log retention</p>
          </div>
          <div className="px-5 py-4">
            <p className="mb-4 text-xs text-zinc-500">
              Logs older than the retention window are pruned hourly when auto-delete is enabled.
              {settings && ` Last updated ${new Date(settings.updatedAt).toLocaleString()}.`}
            </p>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="retention" className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Retention (days)</Label>
                <Input
                  id="retention"
                  type="number"
                  min={1}
                  value={retentionInput}
                  onChange={(e) => setRetentionInput(Math.max(1, Number(e.target.value) || 1))}
                  className="w-32 bg-zinc-900/60 border-zinc-800"
                />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch id="autodelete" checked={autoDeleteInput} onCheckedChange={setAutoDeleteInput} />
                <Label htmlFor="autodelete" className="text-sm">Auto-delete enabled</Label>
              </div>
              <Button onClick={saveSettings} disabled={savingSettings} className="gap-1.5">
                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </div>
          </div>
        </section>
      </main>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this log entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the request record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BreakdownList({ items, unit }: { items: { label: string; count: number }[]; unit: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">No data.</p>;
  }
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-zinc-300">{item.label}</span>
            <span className="text-zinc-500">{item.count} {unit}</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-900">
            <div className="h-1.5 bg-primary" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatBucketLabel(iso: string, bucket: string): string {
  const d = new Date(iso);
  if (bucket === 'month') return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
