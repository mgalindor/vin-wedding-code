import { useCallback, useState } from 'react';
import { AuthenticateUserDto, AuthenticateUserResponseDto } from '@wendy/contracts';
import { useAuth } from './use-auth';

/**
 * Hook to handle user login (POST /oauth/token).
 * Fetches from the API, stores the access token + profile in the auth store.
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
          const body = await response.json();
          throw new Error(
            body.message || `Authentication failed (${response.status})`,
          );
        }

        const data = (await response.json()) as AuthenticateUserResponseDto;

        // Store token + user profile in memory (Rule 11 of the functional spec)
        dispatch({
          type: 'LOGIN',
          payload: {
            accessToken: data.access_token,
            user: data.user,
          },
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
