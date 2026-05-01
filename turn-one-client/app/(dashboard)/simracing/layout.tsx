import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Simracing Live Cockpit | Turn One',
  description: 'Real-time telemetry and dashboard for Assetto Corsa Competizione.',
};

export default function SimracingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
