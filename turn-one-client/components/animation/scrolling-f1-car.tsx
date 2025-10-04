'use client';

import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import Image from 'next/image';
import { useMemo } from 'react';

interface ScrollingF1CarProps {
  opacity?: number;
}

function Frame({ src, index, frame, opacity }: { 
  src: string; 
  index: number; 
  frame: MotionValue<number>;
  opacity: number;
}) {
  const visibility = useTransform(
    frame,
    (latest) => Math.max(0, 1 - Math.abs(latest - index)) * opacity
  );

  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: visibility,
      }}
    >
      <Image
        src={src}
        alt={`F1 car frame ${index + 1}`}
        fill
        className="object-cover object-center"
        priority={index < 5}
        sizes="100vw"
        quality={100}
      />
    </motion.div>
  );
}

export function ScrollingF1Car({ opacity = 0.6 }: ScrollingF1CarProps) {
  const { scrollYProgress } = useScroll({
    offset: ["start", "end"],
  });

  const frameCount = 100;
  const frameSources = useMemo(() => 
    Array.from({ length: frameCount }, (_, i) => {
      const frameNumber = String(i + 1).padStart(4, '0');
      return `/turn-one-car/frames/${frameNumber}.png`;
    }),
    [frameCount]
  );

  const currentFrame = useTransform(scrollYProgress, [0, 1], [0, frameCount - 1]);

  return (
    <motion.div className="fixed inset-0" style={{ zIndex: -1 }}>
      {frameSources.map((src, index) => (
        <Frame
          key={src}
          src={src}
          index={index}
          frame={currentFrame}
          opacity={opacity}
        />
      ))}
    </motion.div>
  );
}
