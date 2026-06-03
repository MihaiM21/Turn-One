'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  User,
  Shield,
  CreditCard,
  Save,
  Camera,
  Calendar,
  Crown,
  Zap,
  Coins,
  AlertTriangle,
  Loader2,
  Trophy,
  CheckCircle2,
  Clock,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { DashboardHeader } from '@/components/dashboard/live dashboard/dashboard-header';
import { PageHeader } from '@/components/dashboard/page-header';
import { ExploreMoreLinks } from '@/components/dashboard/explore-more-links';
import {
  fetchUserProfile,
  updateUserProfile,
  fetchTokenStatus,
  changeUserPassword,
} from '@/lib/userService';
import { UserProfile, TokenStatus, PasswordChangeRequest } from '@/types/user-types';
import { toast } from 'sonner';
import { useBalanceRefresh } from '@/lib/balance-events';

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="border-b border-zinc-800 px-5 py-3">
      <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">{label}</p>
      <p className="mt-0.5 font-bold text-sm">{title}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">{label}</Label>
      {children}
    </div>
  );
}

const getFeaturesByPlan = (planType: string): string[] => {
  switch (planType) {
    case 'PRO':
      return [
        'Real-time telemetry data',
        'Advanced analytics dashboard',
        'Historical race data access',
        'Track comparison tools',
        'Export capabilities',
        'Priority support',
      ];
    case 'ELITE':
      return [
        'All PRO features',
        'Exclusive data insights',
        'Custom analytics',
        'API access',
        'White-label options',
        'Dedicated support',
      ];
    default:
      return ['Basic telemetry data', 'Standard analytics', 'Limited data access'];
  }
};

const getPlanPrice = (plan: string) => {
  switch (plan) {
    case 'BASIC':
      return '$0';
    case 'PRO':
      return '$9.99';
    case 'ELITE':
      return '$19.99';
    default:
      return 'N/A';
  }
};

function PlanIcon({ plan, className }: { plan: string; className?: string }) {
  if (plan === 'ELITE') return <Crown className={className} />;
  if (plan === 'PRO') return <Trophy className={className} />;
  return <Zap className={className} />;
}

const emptyProfile: UserProfile = {
  id: '',
  email: '',
  username: '',
  avatarUrl: '',
  plan: 'BASIC',
  planStartDate: '',
  planEndDate: '',
  autoRenew: false,
  tokens: 0,
  coins: 0,
  lastTokenRefillDate: '',
  createdAt: '',
  lastLogin: '',
};

export default function AccountPage() {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [profileData, setProfileData] = useState<UserProfile>(emptyProfile);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);

  const [passwordData, setPasswordData] = useState<PasswordChangeRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token') || '';
      const profileResponse = await fetchUserProfile(token);
      setProfileData(profileResponse);
      try {
        const tokenResponse = await fetchTokenStatus(token);
        setTokenStatus(tokenResponse);
      } catch {
        // optional
      }
    } catch {
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useBalanceRefresh(loadUserData);

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token') || '';
      const response = await updateUserProfile(token, profileData);
      if (response.success) {
        toast.success('Profile updated successfully');
        setProfileData(response.data);
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token') || '';
      const response = await changeUserPassword(token, passwordData);
      if (response.success) {
        toast.success('Password updated successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(response.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmUpgrade = async () => {
    try {
      setIsChangingPlan(true);
      const token = localStorage.getItem('token') || '';
      const planEnumMap: Record<string, number> = { BASIC: 0, PRO: 1, ELITE: 2 };
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5271/api'}/subscription/upgrade`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(planEnumMap[selectedPlan]),
        },
      );
      if (!response.ok) throw new Error((await response.text()) || 'Failed to upgrade plan');
      await loadUserData();
      toast.success(`Successfully upgraded to ${selectedPlan} plan`);
      setShowUpgradeDialog(false);
    } catch (error: any) {
      console.error('Error upgrading plan:', error);
      toast.error(error.message || 'Failed to upgrade plan');
    } finally {
      setIsChangingPlan(false);
    }
  };

  const confirmDowngrade = async () => {
    try {
      setIsChangingPlan(true);
      const token = localStorage.getItem('token') || '';
      const planEnumMap: Record<string, number> = { BASIC: 0, PRO: 1, ELITE: 2 };
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5271/api'}/subscription/downgrade`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(planEnumMap[selectedPlan]),
        },
      );
      if (!response.ok) throw new Error((await response.text()) || 'Failed to downgrade plan');
      await loadUserData();
      toast.success(`Plan downgrade scheduled. Switching to ${selectedPlan} after current period.`);
      setShowDowngradeDialog(false);
    } catch (error: any) {
      console.error('Error downgrading plan:', error);
      toast.error(error.message || 'Failed to downgrade plan');
    } finally {
      setIsChangingPlan(false);
    }
  };

  const memberSince = profileData.createdAt
    ? new Date(profileData.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black">
        <DashboardHeader />
        <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <section className="flex flex-col items-center gap-3 border border-zinc-800 bg-zinc-950 px-5 py-12 text-center">
            <User className="h-8 w-8 text-zinc-700" />
            <div>
              <p className="font-bold">Authentication required</p>
              <p className="mt-0.5 text-xs text-zinc-500">Please log in to access your account settings.</p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <DashboardHeader />
        <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="flex items-center justify-center border border-zinc-800 bg-zinc-950 px-5 py-12 text-sm text-zinc-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading account data...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <DashboardHeader />

      <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6 space-y-4">
        <PageHeader
          label="Account"
          title="Settings"
          description="Manage your profile, subscription and security."
          stats={[
            { icon: Coins, label: 'Coins', value: profileData.coins.toLocaleString(), iconClassName: 'text-yellow-400' },
            { icon: Zap, label: 'Tokens', value: profileData.tokens.toLocaleString(), iconClassName: 'text-primary' },
            {
              icon: Crown,
              label: 'Plan',
              value: profileData.plan || 'BASIC',
              iconClassName:
                profileData.plan === 'ELITE'
                  ? 'text-primary'
                  : profileData.plan === 'PRO'
                    ? 'text-blue-400'
                    : 'text-zinc-400',
            },
          ]}
        />

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-none border border-zinc-800 bg-zinc-950 p-0 lg:inline-grid lg:w-auto">
            {[
              { value: 'profile', label: 'Profile', icon: User },
              { value: 'subscription', label: 'Subscription', icon: CreditCard },
              { value: 'security', label: 'Security', icon: Shield },
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="gap-2 rounded-none border-b-2 border-transparent bg-transparent px-3 py-2.5 text-[11px] uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-200 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Profile */}
          <TabsContent value="profile" className="mt-0 space-y-4">
            <section className="border border-zinc-800 bg-zinc-950">
              <SectionHeader label="Identity" title="Profile information" />
              <div className="space-y-5 px-5 py-5">
                {/* Avatar row */}
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <div className="relative">
                    <Avatar className="h-20 w-20 rounded-lg border border-zinc-800">
                      <AvatarImage src={profileData.avatarUrl || '/placeholder-user.jpg'} alt={profileData.username} />
                      <AvatarFallback className="rounded-lg bg-zinc-900 text-lg font-semibold text-zinc-300">
                        {profileData.username ? profileData.username[0].toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300 transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Signed in as</p>
                    <h3 className="mt-0.5 truncate text-xl font-bold tracking-tight">{profileData.username || 'User'}</h3>
                    <p className="mt-0.5 truncate text-xs text-zinc-400">{profileData.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="flex items-center gap-1 border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                        <Calendar className="h-3 w-3" />
                        Member since <span className="font-mono tabular-nums normal-case text-zinc-300">{memberSince}</span>
                      </span>
                      <span className="flex items-center gap-1 border border-green-500/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 border-t border-zinc-800/60 pt-4 md:grid-cols-2">
                  <Field label="Username">
                    <Input
                      value={profileData.username}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, username: e.target.value }))}
                      className="rounded-sm border-zinc-800 bg-zinc-900/60"
                    />
                  </Field>
                  <Field label="Email">
                    <Input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                      className="rounded-sm border-zinc-800 bg-zinc-900/60"
                    />
                  </Field>
                  <Field label="Current plan">
                    <div className="relative">
                      <Input
                        value={profileData.plan}
                        disabled
                        className="rounded-sm border-zinc-800 bg-zinc-900/40 pr-8 font-mono tabular-nums"
                      />
                      <PlanIcon plan={profileData.plan} className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary" />
                    </div>
                  </Field>
                  <Field label="Tokens remaining">
                    <div className="relative">
                      <Input
                        value={`${profileData.tokens} tokens`}
                        disabled
                        className="rounded-sm border-zinc-800 bg-zinc-900/40 pr-8 font-mono tabular-nums"
                      />
                      <Zap className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary" />
                    </div>
                  </Field>
                </div>

                <div className="flex justify-end border-t border-zinc-800/60 pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    size="sm"
                    className="rounded-sm bg-primary text-xs font-semibold uppercase tracking-wider text-white hover:bg-primary/90"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        Save changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </section>
          </TabsContent>

          {/* Subscription */}
          <TabsContent value="subscription" className="mt-0 space-y-4">
            <section className="border border-zinc-800 border-l-4 border-l-primary bg-zinc-950">
              <SectionHeader label="Subscription" title="Current plan" />
              <div className="space-y-5 px-5 py-5">
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-primary/30 bg-primary/10">
                      <PlanIcon plan={profileData.plan} className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Tier</p>
                      <h3 className="mt-0.5 text-xl font-bold tracking-tight">{profileData.plan || 'BASIC'}</h3>
                      <p className="mt-0.5 max-w-md text-xs text-zinc-400">
                        {profileData.plan === 'PRO'
                          ? 'More tokens, faster responses and historical data.'
                          : profileData.plan === 'ELITE'
                            ? 'Unlimited tokens, API access and priority processing.'
                            : 'Full access to the platform, completely free.'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                      profileData.plan !== 'BASIC'
                        ? 'border-green-500/40 text-green-400'
                        : 'border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <CheckCircle2 className="mr-1 inline h-3 w-3" />
                    {profileData.plan !== 'BASIC' ? 'Active' : 'Free forever'}
                  </span>
                </div>

                <ul className="grid grid-cols-1 divide-y divide-zinc-800/60 border-t border-zinc-800/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  <li className="flex items-center justify-between px-4 py-3 sm:flex-col sm:items-start sm:justify-start sm:gap-1">
                    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500">
                      <Clock className="h-3.5 w-3.5 text-blue-400" /> Next refill
                    </span>
                    <span className="font-mono text-base font-bold tabular-nums">
                      {tokenStatus?.daysUntilRefill !== undefined ? `${tokenStatus.daysUntilRefill}d` : '—'}
                    </span>
                  </li>
                  <li className="flex items-center justify-between px-4 py-3 sm:flex-col sm:items-start sm:justify-start sm:gap-1">
                    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500">
                      <Zap className="h-3.5 w-3.5 text-primary" /> Tokens
                    </span>
                    <span className="font-mono text-base font-bold tabular-nums text-primary">
                      {(tokenStatus?.tokensRemaining ?? profileData.tokens).toLocaleString()}
                    </span>
                  </li>
                  <li className="flex items-center justify-between px-4 py-3 sm:flex-col sm:items-start sm:justify-start sm:gap-1">
                    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500">
                      <Coins className="h-3.5 w-3.5 text-yellow-400" /> Coins
                    </span>
                    <span className="font-mono text-base font-bold tabular-nums text-yellow-400">
                      {profileData.coins.toLocaleString()}
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="border border-zinc-800 bg-zinc-950">
              <SectionHeader label="Plan features" title={`Included in ${profileData.plan}`} />
              <ul className="grid grid-cols-1 divide-y divide-zinc-800/60 md:grid-cols-2 md:divide-y-0">
                {getFeaturesByPlan(profileData.plan).map((feature, idx, arr) => (
                  <li
                    key={feature}
                    className={`flex items-center gap-3 px-5 py-3 text-sm text-zinc-300 ${
                      idx % 2 === 1 && idx < arr.length ? 'md:border-l md:border-zinc-800/60' : ''
                    } ${idx >= 2 ? 'md:border-t md:border-zinc-800/60' : ''}`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </section>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="mt-0 space-y-4">
            <section className="border border-zinc-800 bg-zinc-950">
              <SectionHeader label="Security" title="Change password" />
              <div className="space-y-4 px-5 py-5">
                <Field label="Current password">
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                    }
                    className="rounded-sm border-zinc-800 bg-zinc-900/60"
                  />
                </Field>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="New password">
                    <Input
                      type="password"
                      placeholder="At least 6 characters"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                      className="rounded-sm border-zinc-800 bg-zinc-900/60"
                    />
                  </Field>
                  <Field label="Confirm new password">
                    <Input
                      type="password"
                      placeholder="Repeat new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                      }
                      className="rounded-sm border-zinc-800 bg-zinc-900/60"
                    />
                  </Field>
                </div>
                <div className="flex justify-end border-t border-zinc-800/60 pt-4">
                  <Button
                    onClick={handleChangePassword}
                    disabled={isSaving}
                    size="sm"
                    className="rounded-sm bg-primary text-xs font-semibold uppercase tracking-wider text-white hover:bg-primary/90"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-1.5 h-3.5 w-3.5" />
                        Update password
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </section>
          </TabsContent>
        </Tabs>

        <ExploreMoreLinks currentPage="/account" />
      </main>

      {/* Upgrade dialog (kept for future use) */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="rounded-xl border-zinc-800 bg-zinc-950 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Crown className="h-5 w-5 text-primary" />
              Upgrade your plan
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Unlock more features and support the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="border border-primary/20 bg-primary/5 px-4 py-3">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold">{selectedPlan} plan</h4>
                <span className="border border-green-500/40 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-green-400 tabular-nums">
                  {getPlanPrice(selectedPlan)}/mo
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2 border border-blue-500/30 bg-blue-500/5 px-3 py-2 text-xs text-zinc-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
              Your upgrade activates immediately and bills monthly.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUpgradeDialog(false)}
              disabled={isChangingPlan}
              className="rounded-sm border-zinc-800 bg-zinc-900/60 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUpgrade}
              disabled={isChangingPlan}
              size="sm"
              className="rounded-sm bg-primary text-xs font-semibold uppercase tracking-wider text-white hover:bg-primary/90"
            >
              {isChangingPlan ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm upgrade'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Downgrade dialog */}
      <Dialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <DialogContent className="rounded-xl border-zinc-800 bg-zinc-950 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              Downgrade your plan
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Current benefits stay until your billing period ends.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="border border-orange-500/30 bg-orange-500/5 px-4 py-3">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold">{selectedPlan} plan</h4>
                <span className="border border-zinc-700 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 tabular-nums">
                  {getPlanPrice(selectedPlan)}/mo
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                You keep {profileData.plan} benefits until{' '}
                <span className="font-mono tabular-nums text-zinc-200">
                  {profileData.planEndDate
                    ? new Date(profileData.planEndDate).toLocaleDateString('en-GB')
                    : 'period end'}
                </span>
                .
              </p>
            </div>
            <div className="flex items-start gap-2 border border-orange-500/30 bg-orange-500/5 px-3 py-2 text-xs text-zinc-300">
              <X className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
              You can cancel this downgrade anytime before it takes effect.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDowngradeDialog(false)}
              disabled={isChangingPlan}
              className="rounded-sm border-zinc-800 bg-zinc-900/60 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDowngrade}
              disabled={isChangingPlan}
              className="rounded-sm text-xs font-semibold uppercase tracking-wider"
            >
              {isChangingPlan ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm downgrade'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
