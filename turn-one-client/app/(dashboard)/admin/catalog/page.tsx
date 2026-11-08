'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Car, Check, ChevronsUpDown, GitMerge, Loader2, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/dashboard/page-header';
import { useToast } from '@/hooks/use-toast';
import * as adminService from '@/lib/adminService';
import {
  BOARD_SIMS, approveCar, approveTrack, getAllCars, getAllTracks, getCarClasses, getCatalogReview, mergeCar, mergeTrack,
  type BoardSim, type CarClassOption, type CatalogReview, type ProvisionalCar, type ProvisionalTrack,
} from '@/lib/simracing/leaderboards';

type Kind = 'track' | 'car';
type SimFilter = BoardSim | 'all';

interface Target {
  slug: string;
  name: string;
  detail: string | null;
}

interface ApproveState {
  kind: Kind;
  id: string;
  slug: string;
  name: string;
  country: string;
  lengthM: string;
  carClass: string;
}

interface MergeState {
  kind: Kind;
  id: string;
  name: string;
  lapCount: number;
  target: Target;
}

const NO_CLASS = '__none__';

const simLabel = (sim: string) => BOARD_SIMS.find((s) => s.value === sim)?.label ?? sim;

export default function AdminCatalogPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [allowed, setAllowed] = useState(false);
  const [sim, setSim] = useState<SimFilter>('iracing');
  const [review, setReview] = useState<CatalogReview | null>(null);
  const [trackTargets, setTrackTargets] = useState<Target[]>([]);
  const [carTargets, setCarTargets] = useState<Target[]>([]);
  const [classes, setClasses] = useState<CarClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [approve, setApprove] = useState<ApproveState | null>(null);
  const [merge, setMerge] = useState<MergeState | null>(null);

  // ── Access gate ────────────────────────────────────────────────────────
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
      setAllowed(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, tracks, cars, cls] = await Promise.all([
        getCatalogReview(sim === 'all' ? undefined : sim),
        getAllTracks(),
        getAllCars(),
        getCarClasses(),
      ]);
      setReview(r);
      setTrackTargets(tracks.filter((t) => t.curated).map((t) => ({
        slug: t.slug, name: t.name, detail: [t.country, t.lengthM ? `${(t.lengthM / 1000).toFixed(3)} km` : null].filter(Boolean).join(' · ') || null,
      })));
      setCarTargets(cars.filter((c) => c.curated).map((c) => ({ slug: c.slug, name: c.name, detail: c.class?.toUpperCase() ?? null })));
      setClasses(cls);
    } catch (e) {
      toast({ title: 'Could not load the catalog', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [sim, toast]);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  // ── Actions ────────────────────────────────────────────────────────────
  const openApproveTrack = (t: ProvisionalTrack) =>
    setApprove({ kind: 'track', id: t.id, slug: '', name: t.name, country: t.country ?? '', lengthM: t.lengthM ? String(t.lengthM) : '', carClass: '' });

  const openApproveCar = (c: ProvisionalCar) =>
    setApprove({ kind: 'car', id: c.id, slug: '', name: c.name, country: '', lengthM: '', carClass: c.classSlug ?? '' });

  const submitApprove = async () => {
    if (!approve) return;
    setBusy(true);
    try {
      const slug = approve.slug.trim() || undefined;
      const name = approve.name.trim() || undefined;
      if (approve.kind === 'track') {
        const length = Number(approve.lengthM);
        await approveTrack(approve.id, {
          slug, name, country: approve.country.trim() || undefined, lengthM: Number.isFinite(length) && length > 0 ? length : undefined,
        });
      } else {
        await approveCar(approve.id, { slug, name, class: approve.carClass || undefined });
      }
      toast({ title: 'Approved', description: `${name ?? 'Entry'} is now curated.` });
      setApprove(null);
      await load();
    } catch (e) {
      toast({ title: 'Approve failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const submitMerge = async () => {
    if (!merge) return;
    setBusy(true);
    try {
      const result = merge.kind === 'track' ? await mergeTrack(merge.id, merge.target.slug) : await mergeCar(merge.id, merge.target.slug);
      toast({
        title: 'Merged',
        description: `${merge.name} → ${merge.target.name}: ${result.aliasesMoved} alias${result.aliasesMoved === 1 ? '' : 'es'}, ${result.lapsMoved} lap${result.lapsMoved === 1 ? '' : 's'} moved.`,
      });
      setMerge(null);
      await load();
    } catch (e) {
      toast({ title: 'Merge failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const tracks = review?.tracks ?? [];
  const cars = review?.cars ?? [];

  if (!allowed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="w-full space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
      <PageHeader
        label="Admin"
        title="Catalog review"
        description="Tracks and cars first seen in a session start provisional. Approve them as they are, or merge them into a curated entry so their laps join that leaderboard."
        stats={[
          { icon: MapPin, label: 'Tracks', value: tracks.length },
          { icon: Car, label: 'Cars', value: cars.length },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Select value={sim} onValueChange={(v) => setSim(v as SimFilter)}>
              <SelectTrigger className="w-[140px]" aria-label="Sim">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sims</SelectItem>
                {BOARD_SIMS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load} disabled={loading} aria-label="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Link href="/admin">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            </Link>
          </div>
        }
      />

      <Section title="Provisional tracks" icon={MapPin} count={tracks.length} loading={loading} empty="No provisional tracks for this sim.">
        {tracks.map((t) => (
          <Row
            key={t.id}
            name={t.name}
            slug={t.slug}
            aliases={t.aliases}
            lapCount={t.lapCount}
            meta={t.lengthM ? `${(t.lengthM / 1000).toFixed(3)} km` : 'length unknown'}
            onApprove={() => openApproveTrack(t)}
            merge={
              <MergePicker
                targets={trackTargets}
                placeholder="Search curated layouts…"
                onPick={(target) => setMerge({ kind: 'track', id: t.id, name: t.name, lapCount: t.lapCount, target })}
              />
            }
          />
        ))}
      </Section>

      <Section title="Provisional cars" icon={Car} count={cars.length} loading={loading} empty="No provisional cars for this sim.">
        {cars.map((c) => (
          <Row
            key={c.id}
            name={c.name}
            slug={c.slug}
            aliases={c.aliases}
            lapCount={c.lapCount}
            meta={c.classSlug ? c.classSlug.toUpperCase() : 'no class'}
            metaMuted={!c.classSlug}
            onApprove={() => openApproveCar(c)}
            merge={
              <MergePicker
                targets={carTargets}
                placeholder="Search curated cars…"
                onPick={(target) => setMerge({ kind: 'car', id: c.id, name: c.name, lapCount: c.lapCount, target })}
              />
            }
          />
        ))}
      </Section>

      {/* Approve */}
      <Dialog open={approve != null} onOpenChange={(open) => !open && setApprove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {approve?.kind === 'car' ? 'car' : 'track layout'}</DialogTitle>
            <DialogDescription>
              Marks it curated. Leave a field empty to keep the current value. A new slug changes the leaderboard URL.
            </DialogDescription>
          </DialogHeader>
          {approve && (
            <div className="grid gap-4">
              <Field label="Name" id="approve-name">
                <Input id="approve-name" value={approve.name} onChange={(e) => setApprove({ ...approve, name: e.target.value })} />
              </Field>
              <Field label="Slug (optional)" id="approve-slug">
                <Input
                  id="approve-slug"
                  placeholder={approve.kind === 'track' ? 'e.g. lime_rock' : 'e.g. bmw_m4_gt3'}
                  value={approve.slug}
                  onChange={(e) => setApprove({ ...approve, slug: e.target.value })}
                />
              </Field>
              {approve.kind === 'track' ? (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Country" id="approve-country">
                    <Input id="approve-country" value={approve.country} onChange={(e) => setApprove({ ...approve, country: e.target.value })} />
                  </Field>
                  <Field label="Length (m)" id="approve-length">
                    <Input
                      id="approve-length"
                      inputMode="decimal"
                      value={approve.lengthM}
                      onChange={(e) => setApprove({ ...approve, lengthM: e.target.value })}
                    />
                  </Field>
                </div>
              ) : (
                <Field label="Class" id="approve-class">
                  <Select
                    value={approve.carClass || NO_CLASS}
                    onValueChange={(v) => setApprove({ ...approve, carClass: v === NO_CLASS ? '' : v })}
                  >
                    <SelectTrigger id="approve-class">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CLASS}>No class</SelectItem>
                      {classes.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprove(null)} disabled={busy}>Cancel</Button>
            <Button onClick={submitApprove} disabled={busy} className="gap-1.5">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge confirmation */}
      <AlertDialog open={merge != null} onOpenChange={(open) => !open && setMerge(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Merge into {merge?.target.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {merge && (
                <>
                  <span className="font-medium text-foreground">{merge.name}</span> and its {merge.lapCount} lap{merge.lapCount === 1 ? '' : 's'} move
                  to <span className="font-medium text-foreground">{merge.target.name}</span> ({merge.target.slug}). Future sessions with the same sim id land
                  there too. The provisional entry is deleted; this can&apos;t be undone from here.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); submitMerge(); }} disabled={busy}>
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <GitMerge className="mr-1.5 h-4 w-4" />} Merge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────

function Section({
  title, icon: Icon, count, loading, empty, children,
}: {
  title: string;
  icon: typeof MapPin;
  count: number;
  loading: boolean;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{title}</h2>
        <Badge variant="secondary" className="ml-1 tabular-nums">{count}</Badge>
      </header>
      {loading && count === 0 ? (
        <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : count === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y divide-border">{children}</ul>
      )}
    </section>
  );
}

function Row({
  name, slug, aliases, lapCount, meta, metaMuted, onApprove, merge,
}: {
  name: string;
  slug: string;
  aliases: { source: string; simId: string }[];
  lapCount: number;
  meta: string;
  metaMuted?: boolean;
  onApprove: () => void;
  merge: React.ReactNode;
}) {
  return (
    <li className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{name}</span>
          <span className={`text-xs ${metaMuted ? 'text-muted-foreground italic' : 'text-muted-foreground'}`}>{meta}</span>
        </div>
        <p className="truncate font-mono text-xs text-muted-foreground">{slug}</p>
        <div className="flex flex-wrap gap-1.5">
          {aliases.map((a) => (
            <Badge key={`${a.source}:${a.simId}`} variant="outline" className="font-mono text-[11px] font-normal">
              {simLabel(a.source)} · {a.simId}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="mr-1 text-xs tabular-nums text-muted-foreground">
          {lapCount} lap{lapCount === 1 ? '' : 's'}
        </span>
        <Button size="sm" onClick={onApprove} className="gap-1.5">
          <Check className="h-4 w-4" /> Approve
        </Button>
        {merge}
      </div>
    </li>
  );
}

function MergePicker({ targets, placeholder, onPick }: { targets: Target[]; placeholder: string; onPick: (t: Target) => void }) {
  const [open, setOpen] = useState(false);
  const sorted = useMemo(() => [...targets].sort((a, b) => a.name.localeCompare(b.name)), [targets]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" role="combobox" aria-expanded={open} className="gap-1.5">
          <GitMerge className="h-4 w-4" /> Merge into…
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="end">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No curated entry found.</CommandEmpty>
            <CommandGroup>
              {sorted.map((t) => (
                <CommandItem
                  key={t.slug}
                  value={`${t.name} ${t.slug}`}
                  onSelect={() => {
                    setOpen(false);
                    onPick(t);
                  }}
                >
                  <div className="min-w-0">
                    <p className="truncate">{t.name}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {t.slug}{t.detail ? ` · ${t.detail}` : ''}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
