'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type Density = 'comfy' | 'compact';

const STORAGE_KEY = 'lr-density';
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener('storage', callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', callback);
  };
}

function getSnapshot(): Density {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'compact' ? 'compact' : 'comfy';
  } catch {
    return 'comfy';
  }
}

function getServerSnapshot(): Density {
  return 'comfy';
}

// useSyncExternalStore, not useState+useEffect: localStorage isn't readable
// during SSR, and a mount-effect calling setState would both trip
// react-hooks/set-state-in-effect and risk a hydration flash. This is the
// API React ships specifically for syncing render state to tab-local,
// synchronous external storage.
export function useDensity() {
  const density = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setDensity = useCallback((next: Density) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing or a full storage quota — the toggle still works
      // for this tab via the listener notify below, it just won't persist.
    }
    listeners.forEach((listener) => listener());
  }, []);

  return [density, setDensity] as const;
}
