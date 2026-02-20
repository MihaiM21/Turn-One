import { getDashboardMetadata } from '@/lib/dashboard-metadata';

export const metadata = getDashboardMetadata('rewards');

export default function RewardsRouteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
