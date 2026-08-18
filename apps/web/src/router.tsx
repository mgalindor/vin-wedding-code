import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
  redirect,
  useLocation,
  useParams,
} from '@tanstack/react-router';
import type { OnboardWeddingPlannerResponseDto } from '@wendy/contracts';
import { UserRole } from '@wendy/contracts';
import { lazy, Suspense } from 'react';

import { useAuth, useRoleGuard } from '@/shared/auth';


const LoginScreen = lazy(() =>
  import('@/features/auth/components/login-screen').then((m) => ({
    default: m.LoginScreen,
  })),
);

const DashboardLayout = lazy(() =>
  import('@/features/dashboard/components/dashboard-layout').then((m) => ({
    default: m.DashboardLayout,
  })),
);

const OnboardWeddingPlannerScreen = lazy(() =>
  import('@/features/admin-onboarding/components/onboard-wedding-planner-screen').then((m) => ({
    default: m.OnboardWeddingPlannerScreen,
  })),
);

const CredentialsConfirmationScreen = lazy(() =>
  import('@/features/admin-onboarding/components/credentials-confirmation-screen').then((m) => ({
    default: m.CredentialsConfirmationScreen,
  })),
);

const PublicInvitationPlaceholderScreen = lazy(() =>
  import('@/routes/(public)/invitation.$token').then((m) => ({
    default: m.PublicInvitationPlaceholderScreen,
  })),
);

const rootRoute = createRootRoute({
  component: RootLayout,
});

function RootLayout(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-live="polite"
          className="flex min-h-screen items-center justify-center text-sm text-muted-foreground"
        >
          Loading…
        </div>
      }
    >
      <Outlet />
    </Suspense>
  );
}

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginScreen,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: RootIndex,
});

function RootIndex(): React.ReactElement {
  const { state } = useAuth();
  return <Navigate to={state.isAuthenticated ? '/dashboard' : '/login'} />;
}

// Coarse auth gate at the route level. The role check (Administrator vs
// Wedding Planner) is intentionally NOT done here — Rule 28 of the
// functional spec forbids reading the role from a client-decoded JWT.
// The fine-grained role gate runs inside the screen via useIsAdmin(),
// which calls the server-authenticated GET /oauth/userinfo.
//
// We only check token *presence* so we can redirect an unauthenticated
// visitor to /login before the React tree mounts. The mirror to
// localStorage is owned by useLogin / useLogout.
function requireAuth() {
  if (typeof window === 'undefined') return;
  const token = window.localStorage.getItem('__wendy_jwt__');
  if (!token) {
    throw redirect({ to: '/login' });
  }
}

// Pathless layout — no path/id collision, no URL segment. Its sole
// purpose is to inject <DashboardLayout /> around every /dashboard/* route.
const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'dashboardLayout',
  component: DashboardLayout,
});

const dashboardIndexRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/dashboard',
  component: DashboardPlaceholderRoute,
});

const onboardWeddingPlannerRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/dashboard/wedding-planners/onboard',
  component: OnboardWeddingPlannerScreen,
  beforeLoad: requireAuth,
});

const credentialsConfirmationRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/dashboard/wedding-planners/$plannerId/credentials',
  component: CredentialsRoute,
  beforeLoad: requireAuth,
});

interface CredentialsState {
  credentials?: OnboardWeddingPlannerResponseDto;
}

function CredentialsRoute(): React.ReactElement {
  // Rule 28 — server-authenticated role gate. The router-level
  // beforeLoad only checks that a token exists; the actual role check
  // runs here via /oauth/userinfo.
  useRoleGuard({ allow: [UserRole.Administrator] });

  // TanStack Router exposes URL params + navigation state to route
  // components via hooks. The form navigates with `params: { plannerId }`
  // and `state: { credentials }`; we forward both to the screen here.
  const params = useParams({ strict: false }) as { plannerId?: string };
  const location = useLocation();
  const state = (location.state as CredentialsState | undefined) ?? {};
  return (
    <CredentialsConfirmationScreen
      plannerId={params.plannerId ?? ''}
      state={state}
    />
  );
}

// Index of /dashboard — placeholder content. The DashboardLayout already
// renders the welcome content when the matched route is this index, so
// this component is intentionally a no-op (<Outlet /> renders nothing).
function DashboardPlaceholderRoute(): React.ReactElement {
  return <Outlet />;
}

const publicInvitationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/i/$token',
  component: PublicInvitationPlaceholderScreen,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardLayoutRoute.addChildren([
    dashboardIndexRoute,
    onboardWeddingPlannerRoute,
    credentialsConfirmationRoute,
  ]),
  publicInvitationRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}