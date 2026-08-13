import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

// Two lazy route groups (ADR-02): (dashboard) and (public). Guests do not
// download the dashboard chunk and vice versa. Code-based routing so we
// can assign explicit paths like /i/:token.

// Lazy chunks — Vite splits each into a separate JS file.
const DashboardPlaceholderScreen = lazy(() =>
  import('@/routes/(dashboard)/index').then((m) => ({
    default: m.DashboardPlaceholderScreen,
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

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPlaceholderScreen,
});

const publicInvitationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/i/$token',
  component: PublicInvitationPlaceholderScreen,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
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