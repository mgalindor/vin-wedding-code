import { Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth, useIsAdmin } from '@/shared/auth';

import { DashboardIndex } from './dashboard-index';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export function DashboardLayout(): React.ReactElement {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate({ from: '/dashboard' });
  const { state } = useAuth();
  const isAdmin = useIsAdmin();
  const location = useLocation();

  const isIndex = location.pathname === '/dashboard';

  // Coarse auth gate: the router-level beforeLoad already redirects when
  // no token is present, but the role-aware sidebar renders via useIsAdmin
  // which requires an authenticated user. We redirect to /login if the
  // in-memory session went away (e.g. tab was closed).
  useEffect(() => {
    if (!state.isAuthenticated || !state.user) {
      void navigate({ to: '/login' });
    }
  }, [state.isAuthenticated, state.user, navigate]);

  if (!state.isAuthenticated || !state.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {t('loading')}
      </div>
    );
  }

  const greetingName = state.user.fullName.split(' ')[0] ?? state.user.fullName;
  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div
      className="flex min-h-screen"
      style={{ background: 'var(--color-surface)' }}
    >
      <Sidebar isAdmin={isAdmin} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          greetingName={greetingName}
          date={today}
        />

        <main className="flex-1 px-10 py-8">
          {isIndex ? <DashboardIndex /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}
