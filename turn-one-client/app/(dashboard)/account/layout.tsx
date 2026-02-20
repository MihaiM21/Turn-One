import { getDashboardMetadata } from '@/lib/dashboard-metadata';

export const metadata = getDashboardMetadata('account');

export default function AccountRouteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
