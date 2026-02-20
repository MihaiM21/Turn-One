import { getDashboardMetadata } from '@/lib/dashboard-metadata';

export const metadata = getDashboardMetadata('games');

export default function GamesRouteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
