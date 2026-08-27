'use client';

import { useEffect, useRef } from 'react';

const EVENT_NAME = 'turn-one:balance-changed';

export function notifyBalanceChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function useBalanceRefresh(callback: () => void) {
  // Callers pass an inline function, so keying the effect on `callback` would
  // add and remove both listeners on every render. Hold it in a ref and register
  // the listeners once.
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => callbackRef.current();
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('focus', handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener('focus', handler);
    };
  }, []);
}
