import { useQuery } from '@tanstack/react-query';
import type { UserProfileDto } from '@wendy/contracts';

import { useAuth } from './use-auth';

// Server-authenticated role source. Replaces client-side JWT-decoded
// role claims for any UI-gating decision (Rule 28).
export function useUserInfo() {
  const { state, dispatch } = useAuth();
  const token = state.accessToken;

  const query = useQuery<UserProfileDto>({
    enabled: Boolean(token),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    queryKey: ['oauth', 'userinfo'],
    queryFn: async () => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
      const res = await fetch(`${baseUrl}/oauth/userinfo`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.status === 401) {
        dispatch({ type: 'LOGOUT' });
        throw new Error('Session expired');
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Request failed (${res.status})`);
      }

      return (await res.json()) as UserProfileDto;
    },
  });

  return query;
}

export function useIsAdmin(): boolean {
  const { data } = useUserInfo();
  return data?.role === 'Administrator';
}