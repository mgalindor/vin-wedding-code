import { useNavigate } from '@tanstack/react-router';
import type { UserRole } from '@/shared/api';
import { useEffect } from 'react';

import { useUserInfo } from './use-user-info';

interface UseRoleGuardOptions {
  /** Roles allowed to see this screen. */
  allow: ReadonlyArray<UserRole>;
  /** Where to send someone without the right role. Default `/dashboard`. */
  redirectTo?: string;
}

/**
 * Server-authenticated role gate. Redirects to `redirectTo` whenever the
 * calling user's role is not in the allow-list. The role is read from a
 * server-authenticated call to `GET /oauth/userinfo` via {@link useUserInfo},
 * NEVER from a client-side JWT decode — a forged JWT could otherwise let
 * a non-admin render Administrator-only affordances.
 *
 * - While the userinfo request is in flight, no redirect happens
 *   (the screen renders whatever it renders normally). The hook does
 *   NOT render a loading spinner — that's the screen's job.
 * - When the call resolves with a non-allowed role, the hook redirects.
 * - When the call resolves with an allowed role, the hook is a no-op.
 * - When the call resolves with 401, the auth store is cleared inside
 *   the api-client and the screen is responsible for its own login
 *   bounce.
 */
export function useRoleGuard({
  allow,
  redirectTo = '/dashboard',
}: UseRoleGuardOptions): void {
  const { data, isLoading } = useUserInfo();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    const roles = data?.roles ?? [];
    if (roles.length === 0) return; // unauthenticated / loading / 401 already cleared
    const allowed = roles.some((r) => allow.includes(r));
    if (!allowed) {
      void navigate({ to: redirectTo });
    }
  }, [data, isLoading, allow, redirectTo, navigate]);
}
