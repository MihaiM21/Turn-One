import { MainFooter } from '@/components/footer/main-footer';
import { Suspense } from "react"

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <div className="site-pages">
        {children}
        <MainFooter />
      </div>
    </Suspense>
  );
}