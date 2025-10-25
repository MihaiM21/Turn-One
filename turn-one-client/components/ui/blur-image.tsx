'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface BlurImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
}

export function BlurImage({ src, alt, className, width, height, fill }: BlurImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        className={cn(
          'duration-700 ease-in-out',
          isLoading ? 'scale-110 blur-lg' : 'scale-100 blur-0'
        )}
        onLoadingComplete={() => setIsLoading(false)}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        quality={100}
        priority
      />
    </div>
  );
}