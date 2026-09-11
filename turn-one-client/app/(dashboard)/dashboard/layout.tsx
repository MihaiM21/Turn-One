import { getDashboardMetadata } from '@/lib/dashboard-metadata';


export const metadata = getDashboardMetadata('dashboard');

export default function DashboardRouteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
