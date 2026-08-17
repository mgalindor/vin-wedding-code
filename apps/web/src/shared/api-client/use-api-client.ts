import { useAuth } from '@/shared/auth';

/**
 * Fetch wrapper that injects the Bearer token and clears auth on 401.
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

      const response = await fetch(
        `/api/v1${url}`,
        {
          ...options,
          headers,
        },
      );

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
