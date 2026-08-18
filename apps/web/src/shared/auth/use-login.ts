import type {
  AuthenticateUserDto,
  AuthenticateUserResponseDto,
  UserProfileDto,
} from '@wendy/contracts';
import { useCallback, useState } from 'react';

import { useAuth } from './use-auth';

/**
 * Decode the JWT payload from an access token. We only read the
 * claims we issued (sub, role, tenantId, fullName, email) — signature
 * verification happens server-side on every request.
 *
 * NOTE: This is a trust-on-first-use decode; any caller could craft
 * a JWT with arbitrary claims. The token is only ever used to send
 * Authorization: Bearer to the API, where RS256 signature verification
 * rejects forgeries.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!payload) return null;
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Hydrate a UserProfileDto from the JWT claims. Throws if the token
 * shape is unexpected so the caller can surface an error instead of
 * storing a half-populated profile.
 */
function profileFromClaims(claims: Record<string, unknown>): UserProfileDto {
  const { sub, role, tenantId, fullName, email } = claims;
  if (!sub || !role || !tenantId || !fullName || !email) {
    throw new Error('Access token is missing required claims');
  }
  return {
    id: sub as UserProfileDto['id'],
    fullName: fullName as string,
    email: email as string,
    role: role as UserProfileDto['role'],
    tenantId: tenantId as UserProfileDto['tenantId'],
  };
}

/**
 * Hook to handle user login (POST /oauth/token).
 * Fetches from the API, decodes the access_token, and stores the
 * token + derived profile in the auth store.
 *
 * Usage:
 * ```tsx
 * const { login, isLoading, error } = useLogin();
 * await login({ grant_type: 'password', username: 'miguel@wendy', password: '...' });
 * ```
 */
export function useLogin() {
  const { dispatch } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (dto: AuthenticateUserDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
        const response = await fetch(`${baseUrl}/oauth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(
            body.message || `Authentication failed (${response.status})`,
          );
        }

        const data = (await response.json()) as AuthenticateUserResponseDto;

        // The login response only carries the OAuth token shape
        // (access_token, token_type, expires_in). The user's profile
        // (fullName, email, role, tenantId) is encoded in the JWT
        // claims — decode once here and store alongside the token.
        const claims = decodeJwtPayload(data.access_token);
        if (!claims) {
          throw new Error('Server returned a malformed access token');
        }
        const user = profileFromClaims(claims);

        // Mirror the access token to localStorage so route-level guards
        // (TanStack Router beforeLoad) can read it before the React tree
        // mounts. The auth store stays the in-memory source of truth.
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem('__wendy_jwt__', data.access_token);
          } catch {
            // localStorage may be unavailable (private mode); in-memory store is the fallback.
          }
        }
        dispatch({
          type: 'LOGIN',
          payload: { accessToken: data.access_token, user },
        });
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
