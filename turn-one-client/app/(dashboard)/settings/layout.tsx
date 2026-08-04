import { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';


export const metadata: Metadata = generateSEO({
  title: 'Settings',
  description: 'Manage your Turn One account settings.',
  url: '/settings',
  noIndex: true,
});

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
