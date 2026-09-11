import { getDashboardMetadata } from '@/lib/dashboard-metadata';


export const metadata = getDashboardMetadata('live');

export default function LiveRouteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
