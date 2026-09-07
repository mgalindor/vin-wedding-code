import type { UserProfile } from '@/shared/api/types';
import {
  type Dispatch,
  type ReactNode,
  createContext,
  useCallback,
  useMemo,
  useReducer,
} from 'react';

import { clearPersistedTokens, persistAccessToken } from '@/shared/api/errors';

import { isTokenAlive, profileFromAccessToken } from './jwt';

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: UserProfile | null;
}

export type AuthAction =
  | { type: 'LOGIN'; payload: { accessToken: string; user: UserProfile } }
  | { type: 'LOGOUT' }
  | { type: 'PATCH_USER'; payload: Partial<UserProfile> };

const emptyState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  user: null,
};

function hydrateFromStorage(): AuthState {
  if (typeof window === 'undefined') return emptyState;
  try {
    const token = window.localStorage.getItem('__deer_jwt__');
    if (!token || !isTokenAlive(token)) {
      // Expired (or missing) — drop it; the next API call will surface
      // a 401 that the api-client converts to a login redirect.
      clearPersistedTokens();
      return emptyState;
    }
    return {
      isAuthenticated: true,
      accessToken: token,
      user: profileFromAccessToken(token),
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
    case 'PATCH_USER':
      return state.user
        ? { ...state, user: { ...state.user, ...action.payload } }
        : state;
    default:
      return state;
  }
}

export interface AuthContextValue {
  state: AuthState;
  /**
   * Internal-only reducer dispatch. Features should use the
   * `useAuth()`, `useLogin()`, and `useLogout()` hooks rather than
   * calling `dispatch` directly.
   */
  dispatch: Dispatch<AuthAction>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, undefined, hydrateFromStorage);
  const signOut = useCallback(() => {
    clearPersistedTokens();
    dispatch({ type: 'LOGOUT' });
  }, [dispatch]);
  const value = useMemo<AuthContextValue>(
    () => ({ state, dispatch, signOut }),
    [state, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Patch the in-memory profile (e.g. after a successful self-edit).
 * Triggers a re-render so the sidebar shows the new display name.
 */
export function applyProfilePatch(
  dispatch: Dispatch<AuthAction>,
  patch: Partial<UserProfile>,
) {
  dispatch({ type: 'PATCH_USER', payload: patch });
}

/**
 * Store an access token + derived profile into both React state and
 * localStorage. Used by `useLogin` on a successful POST /oauth/token.
 */
export function applyLogin(
  dispatch: Dispatch<AuthAction>,
  accessToken: string,
  user: UserProfile,
) {
  persistAccessToken(accessToken);
  dispatch({ type: 'LOGIN', payload: { accessToken, user } });
}
