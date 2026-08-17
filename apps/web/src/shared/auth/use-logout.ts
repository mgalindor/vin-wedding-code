import { useCallback } from 'react';
import { useAuth } from './use-auth';

/**
 * Hook to handle user logout.
 * Clears the in-memory auth state (Rule 18 of the functional spec).
 * The JWT on the backend remains valid until natural expiry, but the FE
 * cannot use it since the token is no longer in memory.
 *
 * Usage:
 * ```tsx
 * const { logout } = useLogout();
 * logout(); // redirects to /login
 * ```
 */
export function useLogout() {
  const { dispatch } = useAuth();

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, [dispatch]);

  return { logout };
}
