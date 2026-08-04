import { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';


export const metadata: Metadata = generateSEO({
  title: 'Admin',
  description: 'Turn One admin panel.',
  url: '/admin',
  noIndex: true,
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
