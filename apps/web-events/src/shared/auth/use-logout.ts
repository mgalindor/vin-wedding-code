import { useCallback, useState } from 'react';

import { useAuth } from './use-auth';

interface UseLogoutResult {
  logout: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Sign-out: revoke the access token server-side (best-effort,
 * fire-and-forget — we never block the UI on it) and clear the
 * in-memory auth store. The api-client's next call will bounce the
 * user to /login regardless.
 */
export function useLogout(): UseLogoutResult {
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch('/oauth/logout', {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {
        /* server unreachable — the client-side cleanup still runs */
      });
    } finally {
      signOut();
      setIsLoading(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, [signOut]);

  return { logout, isLoading };
}
