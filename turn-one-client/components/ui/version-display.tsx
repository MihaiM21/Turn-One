"use client";
import { useVersion } from '@/components/providers/version-provider';

export function VersionDisplay({ className }: { className?: string }) {
  const { version, isLoading } = useVersion();

  if (isLoading) {
    return <span className={className}>Loading version...</span>;
  }

  return (
    <span className={className}>
      v{version?.version || '1.0.0'}
      {version?.preRelease ? `-${version.preRelease}` : ''}
    </span>
  );
}

export default VersionDisplay;