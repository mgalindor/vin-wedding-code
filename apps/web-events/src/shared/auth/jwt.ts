import type { UserProfile, UserRole } from '@/shared/api/types';

/**
 * Decode every claim off a JWT payload without verifying the signature.
 * Intended for trust-on-first-use reads of the portal's own freshly
 * minted access tokens. Any forged token will fail signature
 * verification on the BE.
 */
function decodeAllClaims(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!payload) return {};
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Re-hydrate a {@link UserProfile} from a freshly-issued access token.
 *
 * The portal hydrates the user immediately on login from the JWT claims
 * (`sub`, `preferred_username`, `displayName`, `email`, `roles`) so the
 * sidebar can render before the slower `/oauth/userinfo` round-trip
 * lands. That endpoint is the source of truth and re-runs in
 * `useUserInfo()` for screens that need guaranteed freshness.
 */
export function profileFromAccessToken(token: string): UserProfile {
  const claims = decodeAllClaims(token);
  const sub = typeof claims['sub'] === 'string' ? (claims['sub'] as string) : null;
  if (!sub) {
    throw new Error('Access token is missing the subject claim');
  }
  const rawRoles = claims['roles'];
  const roles: UserRole[] = Array.isArray(rawRoles)
    ? rawRoles.filter(
        (r): r is UserRole =>
          typeof r === 'string' &&
          (r === 'Administrator' || r === 'EventOrganizer'),
      )
    : [];
  return {
    id: sub,
    username:
      typeof claims['preferred_username'] === 'string'
        ? (claims['preferred_username'] as string)
        : '',
    displayName:
      typeof claims['displayName'] === 'string'
        ? (claims['displayName'] as string)
        : typeof claims['name'] === 'string'
          ? (claims['name'] as string)
          : '',
    email: typeof claims['email'] === 'string' ? (claims['email'] as string) : '',
    roles,
    lastLoginAt: null,
  };
}

/**
 * Returns true iff the JWT `exp` claim is still in the future at
 * `now` (defaults to Date.now()). Returns false on any decoding
 * failure so the caller can treat the token as expired.
 */
export function isTokenAlive(token: string, now = Date.now()): boolean {
  const claims = decodeAllClaims(token);
  const exp = claims['exp'];
  return typeof exp === 'number' && exp * 1000 > now;
}
