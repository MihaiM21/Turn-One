"use client";

import { useEffect, useRef, useState } from "react";

/** Tracks whether an element has scrolled into the viewport at least once. */
export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, options ?? { rootMargin: "200px", threshold: 0.1 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, options]);

  return { ref, inView };
}
