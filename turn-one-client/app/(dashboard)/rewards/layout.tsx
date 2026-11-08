import { getDashboardMetadata } from '@/lib/dashboard-metadata';

export const metadata = getDashboardMetadata('rewards');

export default function RewardsRouteLayout({ children }: { children: React.ReactNode }) {
  return <main className="container mx-auto space-y-8 px-4 py-8">{children}</main>;
}
