'use client';

import { useEffect } from 'react';

const EVENT_NAME = 'turn-one:balance-changed';

export function notifyBalanceChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function useBalanceRefresh(callback: () => void) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => callback();
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('focus', handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener('focus', handler);
    };
  }, [callback]);
}
