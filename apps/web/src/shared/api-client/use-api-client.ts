import { useAuth } from '@/shared/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const API_PREFIX = '/api/v1';

/**
 * Fetch wrapper that injects the Bearer token and clears auth on 401.
 *
 * Base URL resolution order:
 *   1. `VITE_API_BASE_URL` env var (production / staging).
 *   2. Same-origin (empty base) — relies on Vite's dev proxy.
 *
 * Every endpoint is prefixed with `/api/v1` per the API versioning rule
 * (the only exempt endpoint, `/oauth/*`, lives in `use-login.ts` /
 * `use-user-info.ts` which use the raw `fetch` API and are pinned to
 * RFC 6749 URL paths).
 */
export function useApiClient() {
  const { state, dispatch } = useAuth();

  return {
    async request<T>(url: string, options?: RequestInit): Promise<T> {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string> | undefined),
      };

      if (state.accessToken) {
        headers.Authorization = `Bearer ${state.accessToken}`;
      }

      const fullUrl = `${API_BASE_URL}${API_PREFIX}${url}`;
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });

      // 401 means the session is gone — drop auth state and bounce to login.
      if (response.status === 401) {
        dispatch({ type: 'LOGOUT' });
        window.location.href = '/login';
        throw new Error('Session expired');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message || `Request failed (${response.status})`,
        );
      }

      return response.json();
    },

    get<T>(url: string) {
      return this.request<T>(url, { method: 'GET' });
    },
    post<T>(url: string, body?: unknown) {
      return this.request<T>(url, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
    },
    put<T>(url: string, body?: unknown) {
      return this.request<T>(url, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      });
    },
    delete<T>(url: string) {
      return this.request<T>(url, { method: 'DELETE' });
    },
  };
}
