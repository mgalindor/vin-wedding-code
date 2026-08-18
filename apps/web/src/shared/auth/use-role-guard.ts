import { useNavigate } from '@tanstack/react-router';
import type { UserRole } from '@wendy/contracts';
import { useEffect } from 'react';

import { useUserInfo } from './use-user-info';

/**
 * Server-authenticated role gate (Rule 28 of US-001).
 *
 * Redirects to `redirectTo` whenever the calling user's role is not in
 * the allow-list. The role is read from a server-authenticated call to
 * `GET /oauth/userinfo` via {@link useUserInfo}, NEVER from a client-side
 * JWT decode — a forged JWT could otherwise let a non-admin render
 * Administrator-only affordances.
 *
 * - While the userinfo request is in flight, no redirect happens (the
 *   screen renders whatever it renders normally). The hook does NOT
 *   render a loading spinner — that's the screen's job.
 * - When the call resolves with a non-allowed role, the hook redirects.
 * - When the call resolves with an allowed role, the hook is a no-op.
 * - When the call resolves with 401, the auth store is cleared inside
 *   `useUserInfo` and the screen is responsible for its own login bounce.
 *
 * Usage in a screen:
 * ```tsx
 * useRoleGuard({ allow: ['Administrator'] });
 * ```
 */
export function useRoleGuard(options: {
  allow: ReadonlyArray<UserRole>;
  redirectTo?: string;
}): void {
  const { allow, redirectTo = '/dashboard' } = options;
  const { data, isLoading } = useUserInfo();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    const role = data?.role;
    if (!role) return; // unauthenticated / loading / 401 already cleared
    if (!allow.includes(role)) {
      void navigate({ to: redirectTo });
    }
  }, [data, isLoading, allow, redirectTo, navigate]);
}
