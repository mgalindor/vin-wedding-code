import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAuth } from './use-auth';

export function useLogout() {
  const { dispatch } = useAuth();
  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('__wendy_jwt__');
      } catch {
        // localStorage may be unavailable
      }
    }
    queryClient.clear();
    dispatch({ type: 'LOGOUT' });
  }, [dispatch, queryClient]);

  return { logout };
}