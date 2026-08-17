import { useEffect } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth, useLogout } from '@/shared/auth';

/**
 * Authenticated layout: greeting + role badge + outlet for child routes.
 * Bounces to /login if auth state becomes invalid.
 */
export function DashboardLayout(): React.ReactElement {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate({ from: '/dashboard' });
  const { state } = useAuth();
  const { logout } = useLogout();

  // Safety check: if auth state is invalid, redirect to login
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

  const handleLogout = () => {
    logout();
    void navigate({ to: '/login' });
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ background: '#f9f8f7' }}>
      {/* Header */}
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
          <p
            className="text-sm mt-1"
            style={{ color: '#605e5c' }}
          >
            {state.user.email}
          </p>
        </div>

        {/* User role badge */}
        <div
          className="px-4 py-2 rounded text-sm font-semibold"
          style={{
            background: state.user.role === 'Administrator' ? '#ffe088' : '#d1e4fb',
            color:
              state.user.role === 'Administrator' ? '#554300' : '#091d2e',
          }}
        >
          {state.user.role}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-[52px] py-12 flex flex-col items-center justify-center">
        <Outlet />
      </main>
    </div>
  );
}

/**
 * Sprint 1 landing: greeting + zeroed stats. Real widgets arrive in later stories.
 */
export function DashboardPlaceholder(): React.ReactElement {
  const { t } = useTranslation('dashboard');
  const { state } = useAuth();

  return (
    <div className="w-full max-w-2xl text-center space-y-8">
      {/* Main message */}
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
        <p
          className="text-lg leading-relaxed"
          style={{ color: '#4d4635' }}
        >
          {t('landing.subtitle')}
        </p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-3 gap-6 mt-12">
        {/* Weddings card */}
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

        {/* Guests card */}
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

        {/* RSVPs card */}
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

      {/* Footer message */}
      <div
        className="mt-12 p-6 rounded-lg"
        style={{ background: '#ffe088', borderLeft: '4px solid #d4af37' }}
      >
        <p
          className="text-sm leading-relaxed"
          style={{ color: '#554300' }}
        >
          {t('landing.footer')}
        </p>
      </div>
    </div>
  );
}
