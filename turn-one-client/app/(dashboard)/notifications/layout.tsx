import { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';


export const metadata: Metadata = generateSEO({
  title: 'Notifications',
  description: 'Your Turn One notifications.',
  url: '/notifications',
  noIndex: true,
});

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
