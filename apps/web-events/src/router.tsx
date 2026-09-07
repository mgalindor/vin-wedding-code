import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router';
import { AlertTriangle } from 'lucide-react';
import { Suspense, lazy } from 'react';

import { DashboardHome } from '@/features/dashboard/components/dashboard-home';
import { isTokenAlive } from '@/shared/auth';
import { Button } from '@/shared/ui';

/**
 * Top-level router config.
 *
 * Two lazy route groups:
 *   - `(dashboard)`: authenticated chrome (sidebar + work area)
 *   - `(public)`: guest-facing invitation placeholder (no chrome)
 *
 * Every `/dashboard/*` route is gated by `requireAuth()` which reads
 * the token from localStorage and throws a `redirect()` to /login
 * before the React tree mounts.
 */

// Lazy chunks — keeps initial JS small and isolates admin-only code.
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

const EventsListSection = lazy(() =>
  import('@/features/events/components/events-list-section').then((m) => ({
    default: m.EventsListSection,
  })),
);

const NewEventScreen = lazy(() =>
  import('@/features/events/components/new-event-screen').then((m) => ({
    default: m.NewEventScreen,
  })),
);

const EditEventScreen = lazy(() =>
  import('@/features/events/components/edit-event-screen').then((m) => ({
    default: m.EditEventScreen,
  })),
);

const EventOverview = lazy(() =>
  import('@/features/events/components/event-overview-screen').then((m) => ({
    default: m.EventOverviewScreen,
  })),
);

const EventDetailLayout = lazy(() =>
  import('@/features/events/components/event-detail-layout').then((m) => ({
    default: m.EventDetailLayout,
  })),
);

const EventLocationsScreen = lazy(() =>
  import('@/features/events/components/event-locations-screen').then((m) => ({
    default: m.EventLocationsScreen,
  })),
);

const EventProgramScreen = lazy(() =>
  import('@/features/events/components/event-program-screen').then((m) => ({
    default: m.EventProgramScreen,
  })),
);

const EventContactsScreen = lazy(() =>
  import('@/features/events/components/event-contacts-screen').then((m) => ({
    default: m.EventContactsScreen,
  })),
);

const WeddingDataScreen = lazy(() =>
  import('@/features/events/components/wedding-data-screen').then((m) => ({
    default: m.WeddingDataScreen,
  })),
);

const GuestGroupsScreen = lazy(() =>
  import('@/features/guests/components/guest-groups-screen').then((m) => ({
    default: m.GuestGroupsScreen,
  })),
);

const GuestListScreen = lazy(() =>
  import('@/features/guests/components/guest-list-screen').then((m) => ({
    default: m.GuestListScreen,
  })),
);

const InvitationScreen = lazy(() =>
  import('@/features/invitations/components/invitation-screen').then((m) => ({
    default: m.InvitationScreen,
  })),
);

const UsersListScreen = lazy(() =>
  import('@/features/users/components/users-screens').then((m) => ({
    default: m.UsersListScreen,
  })),
);

const NewUserScreen = lazy(() =>
  import('@/features/users/components/users-screens').then((m) => ({
    default: m.NewUserScreen,
  })),
);

const ProfileScreen = lazy(() =>
  import('@/features/profile/components/profile-screen').then((m) => ({
    default: m.ProfileScreen,
  })),
);

const PublicInvitationPlaceholder = lazy(() =>
  import('@/routes/(public)/invitation.$token').then((m) => ({
    default: m.PublicInvitationPlaceholderScreen,
  })),
);

const PublicGroupRsvp = lazy(() =>
  import('@/routes/(public)/invitation.$token.g.$groupToken').then((m) => ({
    default: m.PublicGroupRsvpScreen,
  })),
);

const TemplateGalleryPreview = lazy(() =>
  import('@/routes/(public)/preview.templates').then((m) => ({
    default: m.TemplateGalleryPreview,
  })),
);

const NotFoundScreen = lazy(() =>
  import('@/routes/not-found').then((m) => ({ default: m.NotFoundScreen })),
);

/**
 * Visible error boundary — anything thrown inside the route tree
 * (auth guard, lazy import, etc.) renders here instead of an
 * infinite Suspense fallback. The user can refresh to retry.
 */
function RootError({ error }: { error: Error }): React.ReactElement {
  // Log to console for the developer; never expose PII.
  // eslint-disable-next-line no-console
  console.error('[Deer Planner] route tree crashed:', error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] p-6">
      <div className="max-w-md rounded-lg border border-[var(--color-destructive)] bg-[var(--color-surface-container-lowest)] p-8 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-error-container)] text-[var(--color-destructive)]">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h1
          className="text-xl font-bold text-[var(--color-on-surface)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-[var(--color-secondary)]">
          The page failed to load. Check the browser console for the full error.
        </p>
        <pre className="mt-4 max-h-40 overflow-auto rounded bg-[var(--color-surface-container-low)] p-3 text-left text-xs text-[var(--color-on-surface)]">
{error.message ?? 'Unknown error'}
        </pre>
        <Button
          className="mt-5"
          onClick={() => window.location.assign('/')}
        >
          Reload home
        </Button>
      </div>
    </main>
  );
}

// --------- Auth guard ---------

function requireAuth() {
  if (typeof window === 'undefined') return;
  const token = window.localStorage.getItem('__deer_jwt__');
  if (!token || !isTokenAlive(token)) {
    throw redirect({ to: '/login' });
  }
}

function maybeRedirectAuth() {
  if (typeof window === 'undefined') return;
  const token = window.localStorage.getItem('__deer_jwt__');
  if (token && isTokenAlive(token)) {
    throw redirect({ to: '/dashboard' });
  }
}

// --------- Route tree ---------

const rootRoute = createRootRoute({
  component: () => (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] text-sm text-[var(--color-secondary)]">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-primary)]" />
          <span className="mx-2">Loading…</span>
        </div>
      }
    >
      <Outlet />
    </Suspense>
  ),
  notFoundComponent: NotFoundScreen,
  errorComponent: RootError,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  // Server-side-style redirect: route to `/login` if there's no token,
  // otherwise straight to `/dashboard`. Using `beforeLoad` (rather
  // than a `<Navigate>` component on first paint) avoids one wasted
  // render and is the path TanStack Router recommends.
  beforeLoad: () => {
    if (typeof window === 'undefined') return;
    const token = window.localStorage.getItem('__deer_jwt__');
    if (token && isTokenAlive(token)) {
      throw redirect({ to: '/dashboard' });
    }
    throw redirect({ to: '/login' });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginScreen,
  beforeLoad: maybeRedirectAuth,
});

// Layout for all /dashboard/* routes. Owns the sidebar + Outlet;
// child routes declare their own paths relative to `/dashboard`.
const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardLayout,
});

const dashboardIndexRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/',
  beforeLoad: requireAuth,
  component: DashboardHome,
});

const eventsListRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'events',
  beforeLoad: requireAuth,
  component: EventsListSection,
});

const newEventRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'events/new',
  beforeLoad: requireAuth,
  component: NewEventScreen,
});

const editEventRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'events/$eventId/edit',
  beforeLoad: requireAuth,
  component: EditEventScreen,
});

// Pathless layout that wraps every `/dashboard/events/$eventId*` route.
// Renders the event header (title, date, countdown) and the tab strip so
// the user always knows which event they're working on, regardless of the
// active tab.
const eventDetailLayoutRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  id: 'eventDetailLayout',
  component: EventDetailLayout,
});

const eventOverviewRoute = createRoute({
  getParentRoute: () => eventDetailLayoutRoute,
  path: 'events/$eventId',
  component: EventOverview,
});

const eventLocationsRoute = createRoute({
  getParentRoute: () => eventDetailLayoutRoute,
  path: 'events/$eventId/locations',
  component: EventLocationsScreen,
});

const eventProgramRoute = createRoute({
  getParentRoute: () => eventDetailLayoutRoute,
  path: 'events/$eventId/program',
  component: EventProgramScreen,
});

const eventContactsRoute = createRoute({
  getParentRoute: () => eventDetailLayoutRoute,
  path: 'events/$eventId/contacts',
  component: EventContactsScreen,
});

const eventWeddingRoute = createRoute({
  getParentRoute: () => eventDetailLayoutRoute,
  path: 'events/$eventId/wedding',
  component: WeddingDataScreen,
});

const eventGuestsGroupsRoute = createRoute({
  getParentRoute: () => eventDetailLayoutRoute,
  path: 'events/$eventId/guests',
  component: GuestGroupsScreen,
});

const eventGuestsListRoute = createRoute({
  getParentRoute: () => eventDetailLayoutRoute,
  path: 'events/$eventId/guests/list',
  component: GuestListScreen,
});

const eventInvitationRoute = createRoute({
  getParentRoute: () => eventDetailLayoutRoute,
  path: 'events/$eventId/invitation',
  component: InvitationScreen,
});

const usersRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'users',
  beforeLoad: requireAuth,
  component: UsersListScreen,
});

const newUserRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'users/new',
  beforeLoad: requireAuth,
  component: NewUserScreen,
});

const profileRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'profile',
  beforeLoad: requireAuth,
  component: ProfileScreen,
});

const publicInvitationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/i/$token',
  component: PublicInvitationPlaceholder,
});

const publicGroupRsvpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/i/$token/g/$groupToken',
  component: PublicGroupRsvp,
});

const previewTemplatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/preview/templates',
  component: TemplateGalleryPreview,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardLayoutRoute.addChildren([
    dashboardIndexRoute,
    eventsListRoute,
    newEventRoute,
    editEventRoute,
    eventDetailLayoutRoute.addChildren([
      eventOverviewRoute,
      eventLocationsRoute,
      eventProgramRoute,
      eventContactsRoute,
      eventWeddingRoute,
      eventGuestsGroupsRoute,
      eventGuestsListRoute,
      eventInvitationRoute,
    ]),
    usersRoute,
    newUserRoute,
    profileRoute,
  ]),
  publicInvitationRoute,
  publicGroupRsvpRoute,
  previewTemplatesRoute,
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
