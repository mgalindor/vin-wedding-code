const STORAGE_KEY = '__deer_jwt__';
const REFRESH_KEY = '__deer_rt__';

/**
 * Typed API error. Carries the HTTP status, the backend-stable error
 * `code` (so we can i18n-key it) and the optional `traceId` for support
 * handoff. The raw `details` map is preserved for form-level field
 * errors that the screen needs to render.
 *
 * The portal never logs PII (no full names, emails, or phones); the
 * `traceId` is the only thing that goes to Sentry/the console.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly traceId: string | undefined;
  public readonly details: Record<string, unknown> | undefined;

  constructor(
    status: number,
    code: string,
    message: string,
    traceId?: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.traceId = traceId;
    this.details = details;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

/**
 * Token persistence helpers — used by the auth store + the api-client.
 * The backend's `/oauth/refresh` honors the HttpOnly refresh cookie OR
 * the body field; we mirror the token to `localStorage` for two reasons:
 *   1. TanStack Router `beforeLoad` reads it to redirect unauthenticated
 *      visitors before the React tree mounts.
 *   2. Surviving a tab refresh (the in-memory store is the source of
 *      truth, but a refresh re-bootstraps).
 *
 * Both are cleared by `logout()` (the BE calls `/oauth/logout` server-
 * side; the FE clears the mirror so subsequent renders don't leak state).
 */
export function readPersistedAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function persistAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // private mode — fall back to in-memory only
  }
}

export function clearPersistedTokens(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* noop */
  }
}

/** Decode the `roles` claim of a JWT without verifying the signature. */
export function decodeJwtRoles(token: string): string[] {
  try {
    const payload = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!payload) return [];
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const claims = JSON.parse(atob(padded)) as Record<string, unknown>;
    const roles = claims['roles'];
    return Array.isArray(roles) ? roles.filter((r) => typeof r === 'string') : [];
  } catch {
    return [];
  }
}

/** Sniff the `sub` claim to short-circuit the userinfo call when needed. */
export function decodeJwtSubject(token: string): string | null {
  try {
    const payload = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!payload) return null;
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const claims = JSON.parse(atob(padded)) as Record<string, unknown>;
    return typeof claims['sub'] === 'string' ? (claims['sub'] as string) : null;
  } catch {
    return null;
  }
}

/**
 * Pull a `traceId` out of either the JSON envelope or the
 * `X-Trace-Id` header (Spring sets both).
 */
export function extractTraceId(
  body: Partial<import('./types').ApiErrorBody> | null,
  headers: Headers,
): string | undefined {
  if (body?.traceId) return body.traceId;
  return headers.get('X-Trace-Id') ?? headers.get('traceparent') ?? undefined;
}
