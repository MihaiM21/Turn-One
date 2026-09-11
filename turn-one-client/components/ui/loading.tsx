"use client";
import React from 'react';
import { VersionDisplay } from './version-display';
import { DiamondLoader } from './diamond-loader';

interface LoadingProps {
  message?: string;
  children?: React.ReactNode;
}

export function Loading({ message = "Loading...", children }: LoadingProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <DiamondLoader size={44} label={message}>
        <VersionDisplay className="text-xs text-muted-foreground/60 mt-1" />
        {children}
      </DiamondLoader>
    </div>
  );
}