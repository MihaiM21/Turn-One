import { getDashboardMetadata } from '@/lib/dashboard-metadata';

export const metadata = getDashboardMetadata('live2');

export default function Live2RouteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
