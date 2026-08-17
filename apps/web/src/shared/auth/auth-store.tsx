import React, { createContext, ReactNode, useReducer } from 'react';
import { UserProfileDto } from '@wendy/contracts';

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

const initialState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  user: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return {
        isAuthenticated: true,
        accessToken: action.payload.accessToken,
        user: action.payload.user,
      };
    case 'LOGOUT':
      return initialState;
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
  const [state, dispatch] = useReducer(authReducer, initialState);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}
