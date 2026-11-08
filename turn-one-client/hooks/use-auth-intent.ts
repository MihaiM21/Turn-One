'use client';

import { useSyncExternalStore } from 'react';
import { currentAuthIntent, type AuthIntent } from '@/lib/auth-utils';

const subscribe = () => () => {};

/**
 * The sign-up intent (`?intent=beta`, or one remembered from an earlier step) for links and copy
 * on the auth pages. `null` during server render and hydration, then the real value.
 */
export function useAuthIntent(): AuthIntent | null {
  return useSyncExternalStore(
    subscribe,
    () => currentAuthIntent(window.location.search),
    () => null
  );
}
