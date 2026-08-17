/**
 * Shared helpers for US-006 / ARC-010 functional verification tests.
 *
 * Credentials, decode utilities, and a small wrapper around fetch() that
 * uses the live backend. The suite assumes:
 *   - Backend running at E2E_API_URL (default http://localhost:3000)
 *   - Frontend running at E2E_BASE_URL (default http://localhost:5173)
 *   - admin@wendy already seeded (run `pnpm db:seed` once)
 */

export const ADMIN_EMAIL = 'admin@wendy';
export const ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD ?? 'gT0xeq6nbhEUVelWnljKx8nWV4ILMNAL';

export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: 'Administrator' | 'WeddingPlanner';
    tenantId: string;
  };
}

export interface AuthError {
  statusCode: number;
  message: string;
}

/** Decode a JWT payload without verifying signature. */
export function decodeJwt(token: string): Record<string, unknown> {
  const part = token.split('.')[1];
  if (!part) throw new Error('malformed JWT');
  const json = Buffer.from(part, 'base64url').toString('utf8');
  return JSON.parse(json) as Record<string, unknown>;
}

export interface LoginOptions {
  username?: string;
  password?: string;
}

/** POST /api/v1/oauth/token — returns the raw response object (status + body). */
export async function login(
  options: LoginOptions = {},
): Promise<{ status: number; body: LoginResponse | AuthError }> {
  const body = {
    grant_type: 'password' as const,
    username: options.username ?? ADMIN_EMAIL,
    password: options.password ?? ADMIN_PASSWORD,
  };

  const res = await fetch(`${API_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: LoginResponse | AuthError;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { statusCode: res.status, message: text };
  }

  return { status: res.status, body: parsed };
}