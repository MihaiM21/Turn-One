import { getDashboardMetadata } from '@/lib/dashboard-metadata';


export const metadata = getDashboardMetadata('generator');

export default function GeneratorRouteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
