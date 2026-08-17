import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
} from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

import { LocaleSwitcher } from '@/features/locale-switcher/locale-switcher';
import { useAuth } from '@/shared/auth';

// Two lazy route groups (ADR-02): (dashboard) and (public). Guests do not
// download the dashboard chunk and vice versa. Code-based routing so we
// can assign explicit paths like /i/:token.

// Lazy chunks — Vite splits each into a separate JS file.
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

const DashboardPlaceholder = lazy(() =>
  import('@/features/dashboard/components/dashboard-layout').then((m) => ({
    default: m.DashboardPlaceholder,
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

// Wraps authenticated routes with the global header (locale switcher).
function AuthenticatedLayout(): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-end gap-3 border-b border-border bg-background/95 px-6 py-3">
        <LocaleSwitcher />
      </header>
      <Outlet />
    </div>
  );
}

// Login route (US-006, Rule 13)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginScreen,
});

// Root index: bounce to /dashboard if signed in, /login otherwise.
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: RootIndex,
});

function RootIndex(): React.ReactElement {
  const { state } = useAuth();
  return <Navigate to={state.isAuthenticated ? '/dashboard' : '/login'} />;
}

// Outer wrapper: global header (locale switcher) + outlet for nested routes.
const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: AuthenticatedLayout,
});

// Inner wrapper: greeting, role badge, logout, and bounce to /login if auth resets.
const dashboardRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/',
  component: DashboardLayout,
});

// Dashboard index placeholder (Sprint 1; future stories will add content)
const dashboardIndexRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/',
  component: DashboardPlaceholder,
});

// Public invitation route
const publicInvitationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/i/$token',
  component: PublicInvitationPlaceholderScreen,
});

// Build route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardLayoutRoute.addChildren([
    dashboardRoute.addChildren([dashboardIndexRoute]),
  ]),
  publicInvitationRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});

// Type the registered routes so useNavigate / <Link> are typed.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}