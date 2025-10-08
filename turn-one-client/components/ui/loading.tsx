"use client";
import React from 'react';
import { VersionDisplay } from './version-display';

export function Loading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{message}</p>
        <VersionDisplay className="text-xs text-muted-foreground/60 mt-1" />
      </div>
    </div>
  );
}