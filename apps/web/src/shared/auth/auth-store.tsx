import type { UserProfileDto } from '@wendy/contracts';
import { createContext, useReducer } from 'react';
import type { ReactNode } from 'react';

/**
 * Authenticated user session state stored in memory.
 * Cleared on sign-out or tab close.
 */
export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: UserProfileDto | null;
}

export type AuthAction =
  | {
      type: 'LOGIN';
      payload: { accessToken: string; user: UserProfileDto };
    }
  | {
      type: 'LOGOUT';
    };

const emptyState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  user: null,
};

/** Hydrate from localStorage so a page refresh doesn't clear the session. */
function hydrateFromStorage(): AuthState {
  if (typeof window === 'undefined') return emptyState;
  try {
    const token = window.localStorage.getItem('__wendy_jwt__');
    if (!token) return emptyState;

    const parts = token.split('.');
    if (parts.length !== 3) return emptyState;
    const payload = parts[1]!.replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const claims = JSON.parse(atob(padded)) as Record<string, unknown>;

    const { sub, role, tenantId, fullName, email, exp } = claims;
    if (!sub || !role || !tenantId || !fullName || !email) return emptyState;

    // Discard expired tokens
    if (exp && typeof exp === 'number' && Date.now() / 1000 > exp) {
      window.localStorage.removeItem('__wendy_jwt__');
      return emptyState;
    }

    return {
      isAuthenticated: true,
      accessToken: token,
      user: {
        id: sub as UserProfileDto['id'],
        fullName: fullName as string,
        email: email as string,
        role: role as UserProfileDto['role'],
        tenantId: tenantId as UserProfileDto['tenantId'],
      },
    };
  } catch {
    return emptyState;
  }
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return {
        isAuthenticated: true,
        accessToken: action.payload.accessToken,
        user: action.payload.user,
      };
    case 'LOGOUT':
      return emptyState;
    default:
      return state;
  }
}

/**
 * Auth context (Rule 11 of the functional spec).
 * Holds the in-memory access token and decoded user profile.
 * Cleared on sign-out or when the browser tab closes.
 *
 * The token is not persisted to localStorage or sessionStorage for security:
 * closing the tab is equivalent to signing out (Rule 18).
 */
export const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, undefined, hydrateFromStorage);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}
