import { getDashboardMetadata } from '@/lib/dashboard-metadata';


export const metadata = getDashboardMetadata('predictions');

export default function PredictionsRouteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
