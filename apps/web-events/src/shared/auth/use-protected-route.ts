import { redirect, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { isTokenAlive } from './jwt';
import { useAuth } from './use-auth';

/**
 * Run as part of a route `beforeLoad` to require an authenticated
 * session. Reads the token from localStorage synchronously so we can
 * short-circuit the navigation BEFORE the React tree mounts.
 *
 * If no token (or an expired one) is present, throws a `redirect()` to
 * `/login` — TanStack Router cancels the navigation and renders the
 * login route in its place.
 */
export function requireAuth() {
  if (typeof window === 'undefined') return;
  const token = window.localStorage.getItem('__deer_jwt__');
  if (!token || !isTokenAlive(token)) {
    throw redirect({ to: '/login' });
  }
}

/**
 * Component-level equivalent: bounce to /login as soon as React notices
 * the auth store is empty (e.g. the user closed their last tab and
 * re-opened it on a deep link, but the in-memory store was rebuilt
 * empty while the token was still valid).
 *
 * The router-level `beforeLoad` already ran, so by the time we render
 * here the JWT is alive; the only job of this hook is to catch the
 * reactive edge case where the in-memory user profile hasn't been
 * hydrated yet.
 */
export function useProtectedRoute() {
  const { state } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state.isAuthenticated) {
      void navigate({ to: '/login' });
    }
  }, [state.isAuthenticated, navigate]);

  return state;
}
