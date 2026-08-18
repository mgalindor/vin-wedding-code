import { Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { WeddingPlannersLandingCard } from '@/features/admin-onboarding/components/wedding-planners-landing-card';
import { useAuth, useIsAdmin } from '@/shared/auth';

export function DashboardLayout(): React.ReactElement {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate({ from: '/dashboard' });
  const { state } = useAuth();
  const isAdmin = useIsAdmin();
  const location = useLocation();

  // The /dashboard index route shows the welcome content + the
  // Administrator-only Wedding Planners entry point; sub-routes
  // (onboarding form, credentials confirmation, …) render through the
  // <Outlet /> below and the landing card is hidden.
  const isIndex = location.pathname === '/dashboard';

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

  return (
    <div className="flex min-h-screen flex-col" style={{ background: '#f9f8f7' }}>
      <header
        className="border-b px-[52px] py-6 flex items-center justify-between"
        style={{ borderColor: '#d0c5af', background: '#ffffff' }}
      >
        <div>
          <h1
            className="text-2xl font-bold"
            style={{
              fontFamily: 'Playfair Display, serif',
              color: '#1c1b1a',
              letterSpacing: '-0.02em',
            }}
          >
            {t('greeting', { name: state.user.fullName })}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#605e5c' }}>
            {state.user.email}
          </p>
        </div>
        <div
          className="px-4 py-2 rounded text-sm font-semibold"
          style={{
            background: state.user.role === 'Administrator' ? '#ffe088' : '#d1e4fb',
            color: state.user.role === 'Administrator' ? '#554300' : '#091d2e',
          }}
        >
          {state.user.role}
        </div>
      </header>
      <main className="flex-1 px-[52px] py-12 flex flex-col items-center justify-center">
        {isIndex ? (
          <>
            <DashboardPlaceholder />
            {isAdmin && <WeddingPlannersLandingCard />}
          </>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}

function DashboardPlaceholder(): React.ReactElement {
  const { t } = useTranslation('dashboard');
  return (
    <div className="w-full max-w-2xl text-center space-y-8">
      <div>
        <h2
          className="text-4xl font-bold mb-3"
          style={{
            fontFamily: 'Playfair Display, serif',
            color: '#1c1b1a',
            letterSpacing: '-0.02em',
          }}
        >
          {t('landing.title')}
        </h2>
        <p className="text-lg leading-relaxed" style={{ color: '#4d4635' }}>
          {t('landing.subtitle')}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-6 mt-12">
        <div
          className="p-6 rounded-lg"
          style={{ background: '#ffffff', borderColor: '#e3e1e0' }}
        >
          <div className="text-3xl font-bold mb-2" style={{ color: '#735c00' }}>
            0
          </div>
          <p style={{ color: '#605e5c' }} className="text-sm">
            {t('landing.stats.weddings')}
          </p>
        </div>
        <div
          className="p-6 rounded-lg"
          style={{ background: '#ffffff', borderColor: '#e3e1e0' }}
        >
          <div className="text-3xl font-bold mb-2" style={{ color: '#735c00' }}>
            0
          </div>
          <p style={{ color: '#605e5c' }} className="text-sm">
            {t('landing.stats.guests')}
          </p>
        </div>
        <div
          className="p-6 rounded-lg"
          style={{ background: '#ffffff', borderColor: '#e3e1e0' }}
        >
          <div className="text-3xl font-bold mb-2" style={{ color: '#735c00' }}>
            0
          </div>
          <p style={{ color: '#605e5c' }} className="text-sm">
            {t('landing.stats.rsvps')}
          </p>
        </div>
      </div>
      <div
        className="mt-12 p-6 rounded-lg"
        style={{ background: '#ffe088', borderLeft: '4px solid #d4af37' }}
      >
        <p className="text-sm leading-relaxed" style={{ color: '#554300' }}>
          {t('landing.footer')}
        </p>
      </div>
    </div>
  );
}