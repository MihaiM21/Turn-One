'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, Loader2, RotateCcw, Users, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardHeader } from '@/components/dashboard/live dashboard/dashboard-header';
import { PageHeader } from '@/components/dashboard/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BETA_INPUTS,
  BETA_PLATFORMS,
  BETA_SIMS,
  SimApiError,
  listBetaApplications,
  setBetaApplicationStatus,
  type AdminBetaApplication,
  type AdminBetaApplicationList,
  type BetaStatus,
} from '@/lib/simracing/api';

type Filter = 'all' | BetaStatus;

/** The closed beta is sized at 20–50 drivers. */
const BETA_TARGET = 50;

const label = <T extends string>(options: { value: T; label: string }[], value: T) =>
  options.find(o => o.value === value)?.label ?? value;

function StatusBadge({ status }: { status: BetaStatus }) {
  if (status === 'accepted') return <Badge>Accepted</Badge>;
  if (status === 'declined') return <Badge variant="outline" className="text-muted-foreground">Declined</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

export default function AdminBetaPage() {
  const [filter, setFilter] = useState<Filter>('pending');
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<AdminBetaApplicationList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const key = `${filter}:${reload}`;
  const loading = loadedKey !== key;

  useEffect(() => {
    let cancelled = false;
    listBetaApplications(filter === 'all' ? undefined : filter)
      .then(d => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch(e => {
        if (cancelled) return;
        setError(
          e instanceof SimApiError && e.status === 403
            ? "You don't have admin privileges."
            : e instanceof Error
              ? e.message
              : 'Failed to load applications.'
        );
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(`${filter}:${reload}`);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, reload]);

  const decide = async (app: AdminBetaApplication, status: BetaStatus) => {
    setBusyId(app.id);
    try {
      await setBetaApplicationStatus(app.id, status);
      toast.success(`${app.username}: ${status}`);
      setReload(r => r + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update status.');
    } finally {
      setBusyId(null);
    }
  };

  const total = data ? data.pending + data.accepted + data.declined : 0;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to admin
        </Link>

        <PageHeader
          label="Admin · Sim racing"
          title="Beta applications"
          description="Pick the closed-beta pilots. Accepted drivers count toward the free sim users milestone."
          stats={[
            { icon: Users, label: 'Applied', value: total },
            { icon: Clock, label: 'Pending', value: data?.pending ?? '—' },
            { icon: CheckCircle2, label: `Accepted / ${BETA_TARGET}`, value: data?.accepted ?? '—' },
            { icon: XCircle, label: 'Declined', value: data?.declined ?? '—', iconClassName: 'text-muted-foreground' },
          ]}
        />

        <Tabs value={filter} onValueChange={v => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="pending">Pending{data ? ` (${data.pending})` : ''}</TabsTrigger>
            <TabsTrigger value="accepted">Accepted{data ? ` (${data.accepted})` : ''}</TabsTrigger>
            <TabsTrigger value="declined">Declined{data ? ` (${data.declined})` : ''}</TabsTrigger>
            <TabsTrigger value="all">All{data ? ` (${total})` : ''}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="overflow-x-auto rounded-md border border-border bg-card">
          {error ? (
            <p className="p-6 text-sm text-destructive">{error}</p>
          ) : loading && !data ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading applications…
            </div>
          ) : !data || data.items.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No applications here yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Sims</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Input</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map(app => {
                  const busy = busyId === app.id;
                  return (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="font-medium">{app.username}</div>
                        <div className="text-xs text-muted-foreground">{app.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {app.sims.map(s => (
                            <Badge key={s} variant="outline">
                              {label(BETA_SIMS, s)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{label(BETA_PLATFORMS, app.platform)}</TableCell>
                      <TableCell>{label(BETA_INPUTS, app.input)}</TableCell>
                      <TableCell className="max-w-xs whitespace-normal text-sm text-muted-foreground">
                        {app.note ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={app.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {app.status !== 'accepted' && (
                            <Button size="sm" disabled={busy} onClick={() => decide(app, 'accepted')}>
                              Accept
                            </Button>
                          )}
                          {app.status !== 'declined' && (
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => decide(app, 'declined')}>
                              Decline
                            </Button>
                          )}
                          {app.status !== 'pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              title="Move back to pending"
                              aria-label="Move back to pending"
                              onClick={() => decide(app, 'pending')}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
}
