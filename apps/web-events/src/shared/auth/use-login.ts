import { useCallback, useState } from 'react';

import {
  type AuthenticateRequest,
  type AuthenticateResponse,
} from '@/shared/api';
import { ApiError } from '@/shared/api/errors';

import { applyLogin } from './auth-store';
import { profileFromAccessToken } from './jwt';
import { useAuth } from './use-auth';

interface UseLoginResult {
  login: (dto: AuthenticateRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to handle user login (`POST /oauth/token` — RFC 6749 shape).
 *
 * The endpoint is NOT under `/api/v1` (Spring exposes auth under
 * `/oauth/*`), so we call `fetch` directly and use `credentials:
 * 'include'` so the refresh-token HttpOnly cookie sticks. The
 * server can also return the refresh token in the body for non-
 * browser clients — we keep the body copy in localStorage as a
 * belt-and-braces measure.
 */
export function useLogin(): UseLoginResult {
  const { dispatch } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (dto: AuthenticateRequest) => {
      setIsLoading(true);
      setError(null);
      try {
        const raw = await fetch('/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grantType: dto.grantType,
            username: dto.username,
            password: dto.password,
          }),
          credentials: 'include',
        });

        if (!raw.ok) {
          const body = (await raw.json().catch(() => ({}))) as {
            message?: string;
            code?: string;
          };
          throw new ApiError(
            raw.status,
            body.code ?? 'login_failed',
            body.message ?? 'Login failed',
          );
        }

        const data = (await raw.json()) as AuthenticateResponse;
        const user = profileFromAccessToken(data.accessToken);
        applyLogin(dispatch, data.accessToken, user);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch],
  );

  return { login, isLoading, error };
}
