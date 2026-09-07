import type { ZodType } from 'zod';

import {
  ApiError,
  clearPersistedTokens,
  extractTraceId,
  readPersistedAccessToken,
} from './errors';
import type { ApiErrorBody } from './types';

export type { ApiErrorBody };
export { ApiError, clearPersistedTokens, readPersistedAccessToken };

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const API_PREFIX = '/api/v1';

export type RequestOptions = RequestInit & {
  /** Override the access token for this request (used by /oauth endpoints). */
  accessToken?: string;
  /** When true, skip the 401 -> logout bounce (used by login + refresh itself). */
  skip401Bounce?: boolean;
  /**
   * Optional Zod schema. When provided, the response is parsed before
   * being returned; a parse failure throws `ApiError(500,
   * 'schema_drift', …)` with the traceId. Endpoints should opt in as
   * their schemas land — see `shared/api/schemas.ts`.
   */
  schema?: ZodType<unknown>;
};

/**
 * Thin `fetch` wrapper that:
 *   - prefixes every URL with `/api/v1`
 *   - injects the Authorization: Bearer header from the persisted store
 *   - parses non-2xx responses into typed `ApiError`s
 *   - bounces the user to /login on 401
 *   - optionally validates 2xx bodies against a Zod schema
 *
 * The class is instantiated once and exported; React hooks wrap it via
 * `useApiClient()` so consumers can mutate React state on 401.
 */
export class ApiClient {
  async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    const token = options.accessToken ?? readPersistedAccessToken();
    if (token && !options.skip401Bounce) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = `${API_BASE_URL}${API_PREFIX}${url}`;
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    if (response.status === 401 && !options.skip401Bounce) {
      clearPersistedTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new ApiError(401, 'unauthenticated', 'Session expired');
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as Partial<ApiErrorBody>;
      throw new ApiError(
        response.status,
        body.code ?? `http_${response.status}`,
        body.message ?? `Request failed (${response.status})`,
        extractTraceId(body, response.headers),
        body.details,
      );
    }

    // 204 No Content — return undefined cast.
    if (response.status === 204) return undefined as unknown as T;
    const raw = (await response.json()) as unknown;

    if (options.schema) {
      const parsed = options.schema.safeParse(raw);
      if (!parsed.success) {
        const traceId = response.headers.get('X-Trace-Id') ?? undefined;
        // Log to console — there's no Sentry yet. The traceId lets a
        // human correlate this with the BE deploy that caused the drift.
        // `dir` (instead of `error`) prints the issues array expanded so
        // you can see path / message / expected without clicking.
        // eslint-disable-next-line no-console
        console.error('[api] schema drift', { url, traceId, raw });
        // eslint-disable-next-line no-console
        console.dir(parsed.error.issues, { depth: null });
        throw new ApiError(
          500,
          'schema_drift',
          'The server response did not match the expected schema.',
          traceId,
          { url, issues: parsed.error.issues },
        );
      }
      return parsed.data as T;
    }

    return raw as T;
  }

  get<T>(url: string, options?: RequestOptions) {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  post<T>(url: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  put<T>(url: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  patch<T>(url: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  delete<T>(url: string, options?: RequestOptions) {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
}

/** Singleton — there is no per-request state. */
export const apiClient = new ApiClient();
