import { useContext } from 'react';

import { AuthContext } from './auth-store';

/**
 * Hook to access the current auth state.
 * Returns { state, dispatch } from the auth context.
 *
 * Usage:
 * ```tsx
 * const { state } = useAuth();
 * if (state.isAuthenticated) {
 *   console.log('User:', state.user?.fullName);
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
