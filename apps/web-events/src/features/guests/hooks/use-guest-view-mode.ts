import { useCallback, useEffect, useState } from 'react';

/**
 * Available guest-management views. Kept as a string-literal union so
 * the persisted value is type-safe across reads/writes.
 */
export type GuestViewMode = 'simple' | 'groups';

const STORAGE_PREFIX = 'deer:guests:view:';

/**
 * Hook that remembers the user's preferred view mode per event in
 * `localStorage`. Defaults to `simple` (flat list) for new events and
 * restores the previous choice on subsequent visits.
 *
 * Why localStorage instead of a backend field:
 *   - Per-event UX preference, not a domain attribute
 *   - Avoids a schema migration just to store "did the user prefer the
 *     simple or the groups view last time"
 *   - Survives across sessions on the same browser/device
 *
 * The hook is SSR-safe: it reads/writes only when `window` is defined.
 */
export function useGuestViewPersistence(eventId: string): {
  view: GuestViewMode;
  setView: (mode: GuestViewMode) => void;
} {
  const storageKey = `${STORAGE_PREFIX}${eventId}`;
  const [view, setViewState] = useState<GuestViewMode>('simple');

  // Restore the previous choice once the eventId is known. We can't
  // do this in `useState`'s initializer because `eventId` arrives via
  // route params after the first render.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored === 'simple' || stored === 'groups') {
      setViewState(stored);
    }
  }, [storageKey]);

  const setView = useCallback(
    (mode: GuestViewMode) => {
      setViewState(mode);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, mode);
      }
    },
    [storageKey],
  );

  return { view, setView };
}
