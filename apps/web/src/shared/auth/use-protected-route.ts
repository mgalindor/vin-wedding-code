import { useAuth } from '@/shared/auth';

/**
 * Hook to check if user is authenticated and redirect if not.
 * Used in protected routes to enforce authentication (Rule 21 of the functional spec).
 *
 * Usage in a route:
 * ```ts
 * const dashboardRoute = createRoute({
 *   beforeLoad: () => {
 *     // Will throw redirect in beforeLoad
 *   },
 * });
 * ```
 */
export function useProtectedRoute() {
  const { state } = useAuth();

  return {
    isAuthenticated: state.isAuthenticated,
    user: state.user,
  };
}
