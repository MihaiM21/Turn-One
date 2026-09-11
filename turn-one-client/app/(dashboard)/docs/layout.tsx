import { getDashboardMetadata } from '@/lib/dashboard-metadata';


export const metadata = getDashboardMetadata('docs');

export default function DocsRouteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
