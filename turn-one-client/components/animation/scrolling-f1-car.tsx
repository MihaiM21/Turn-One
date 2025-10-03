'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';

interface ScrollingF1CarProps {
  opacity?: number;
}

export function ScrollingF1Car({ opacity = 0.6 }: ScrollingF1CarProps) {
  const { scrollYProgress } = useScroll({
    offset: ["start", "end"]
  });

  // Create frame indices for the animation
  const frameCount = 100;
  const frameSources = Array.from({ length: frameCount }, (_, i) => {
    // Pad the number with leading zeros
    const frameNumber = String(i + 1).padStart(4, '0');
    return `/turn-one-car/frames/${frameNumber}.png`;
  });

  // Transform scroll progress to frame index
  const currentFrame = useTransform(
    scrollYProgress,
    [0, 1],
    [0, frameCount - 1]
  );

  return (
    <div className="fixed inset-0" style={{ zIndex: -1 }}>
      {frameSources.map((src, index) => (
        <motion.div
          key={src}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: useTransform(
              currentFrame,
              (frame) => (1 - Math.abs(frame - index)) * opacity
            ),
          }}
        >
          <Image
            src={src}
            alt={`F1 car frame ${index + 1}`}
            fill
            className="object-cover object-center opacity-100"
            priority
            sizes="100vw"
            quality={100}
          />
        </motion.div>
      ))}
    </div>
  );
}