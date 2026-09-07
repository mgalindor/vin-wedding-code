import { Outlet } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { useProtectedRoute } from '@/shared/auth';
import { Spinner } from '@/shared/ui';

import { Sidebar } from './sidebar';

/**
 * Pathless wrapper for every `/dashboard/*` route. Renders the
 * sidebar + the matched route's `<Outlet />`. The index route
 * (`/dashboard`) renders `DashboardHome`; sub-routes render their
 * own screen.
 */
export function DashboardLayout(): React.ReactElement {
  const auth = useProtectedRoute();
  const { t } = useTranslation('dashboard');

  if (!auth.isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] text-sm text-[var(--color-secondary)]">
        <Spinner />
        <span className="sr-only">{t('loading')}</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--color-surface)]">
      <Sidebar />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
