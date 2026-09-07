import { useQuery } from '@tanstack/react-query';

import type { UserProfile } from '@/shared/api/types';
import { readPersistedAccessToken } from '@/shared/api/errors';

import { useAuth } from './use-auth';

export const userInfoQueryKey = (userId: string | null) =>
  ['oauth', 'userinfo', userId] as const;

/**
 * Server-authenticated profile read. The role check runs here, NOT off
 * a client-decoded JWT, per the FE security checklist in
 * 3-architecture/3.3-decision-record/adr-08-i18n-i18next.md §AuthZ.
 *
 * The Java BE exposes this at `GET /oauth/userinfo` (NOT under
 * `/api/v1` because it follows the RFC 6749 `/oauth/*` convention
 * alongside `/oauth/token`). We bypass the api-client here and call
 * `fetch` directly so the URL stays unprefixed.
 *
 * Backed by React Query so multiple screens (sidebar, profile page,
 * role guards) can subscribe without firing N parallel calls.
 */
export function useUserInfo() {
  const { state } = useAuth();
  const userId = state.user?.id ?? null;

  const query = useQuery({
    enabled: Boolean(state.accessToken && userId),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    queryKey: userInfoQueryKey(userId),
    queryFn: async (): Promise<UserProfile> => {
      const token = readPersistedAccessToken();
      const res = await fetch('/oauth/userinfo', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`userinfo failed (${res.status})`);
      }
      return (await res.json()) as UserProfile;
    },
  });

  return query;
}

/** True iff the authenticated user has the `Administrator` role. */
export function useIsAdmin(): boolean {
  const { data } = useUserInfo();
  return data?.roles.includes('Administrator') ?? false;
}

/** True iff the authenticated user has the `EventOrganizer` role. */
export function useIsOrganizer(): boolean {
  const { data } = useUserInfo();
  return data?.roles.includes('EventOrganizer') ?? false;
}
