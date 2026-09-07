import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui';
import { ErrorBanner, FieldShell, Input, Label } from '@/shared/ui';
import { useAuth, useLogin } from '@/shared/auth';

type LoginForm = {
  username: string;
  password: string;
};

/**
 * Deer Planner login screen — split panel layout:
 *   - Left: brand block, fully on-brand (warm parchment + gold).
 *   - Right: form with English/Spanish pill toggle, error banner,
 *     helper copy explaining the credentials shape.
 *
 * The screen is role-agnostic — both Administrators and EventOrganizers
 * land here. After a successful login the userinfo hook decides which
 * dashboard sections to show, never the login screen itself.
 */
export function LoginScreen(): React.ReactElement {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { login, isLoading, error } = useLogin();
  const { t, i18n } = useTranslation(['auth', 'common']);
  const [language, setLanguage] = useState<'en' | 'es'>(
    i18n.language?.startsWith('es') ? 'es' : 'en',
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    mode: 'onSubmit',
    defaultValues: { username: '', password: '' },
  });

  // Already authed? Skip the form and ship the user to the dashboard.
  useEffect(() => {
    if (state.isAuthenticated) {
      void navigate({ to: '/dashboard' });
    }
  }, [state.isAuthenticated, navigate]);

  const onSubmit = async (dto: LoginForm) => {
    try {
      await login({
        grantType: 'password',
        username: dto.username.trim().toLowerCase(),
        password: dto.password,
      });
      // The auth store update + useEffect handles the redirect.
    } catch {
      // Error is already inside useLogin; we keep showing it inline.
    }
  };

  const handleLanguage = (lang: 'en' | 'es') => {
    setLanguage(lang);
    void i18n.changeLanguage(lang);
    // Persist the choice (the i18n detector also handles cookies).
    if (typeof document !== 'undefined') {
      document.cookie = `i18next=${lang}; path=/; max-age=${60 * 60 * 24 * 365}`;
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      {/* ===== LEFT — brand panel ===== */}
      <div
        className="relative hidden w-[58%] flex-col justify-between px-[52px] py-10 lg:flex"
        style={{
          background:
            'linear-gradient(155deg, #1c1a00 0%, #2d2900 45%, #1a1600 80%, #0f0d00 100%)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 80% 20%, rgba(229, 195, 73, 0.18) 0%, transparent 60%)',
          }}
        />

        {/* Brand mark */}
        <div className="relative z-10 flex items-center gap-3">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <circle cx="20" cy="20" r="18" stroke="#e9c349" strokeWidth="1.5" />
            <path
              d="M14 26c2-3 4-5 6-5s4 2 6 5"
              stroke="#e9c349"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="15" cy="16" r="1.4" fill="#e9c349" />
            <circle cx="25" cy="16" r="1.4" fill="#e9c349" />
          </svg>
          <div>
            <div
              className="text-3xl font-bold leading-none text-[#e9c349]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Deer
            </div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
              {t('common:app.tagline')}
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <p
            className="max-w-[460px] text-4xl font-bold leading-[1.15] text-white"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
          >
            {t('common:app.taglineLong')}
          </p>
          <p className="mt-4 max-w-[420px] text-sm leading-relaxed text-white/70">
            {t('common:app.taglineBody')}
          </p>
        </div>

        {/* Footer note */}
        <div className="relative z-10 text-[12px] leading-relaxed text-white/35">
          {t('common:app.footerNote')}
        </div>
      </div>

      {/* ===== RIGHT — form panel ===== */}
      <div className="flex w-full flex-col justify-center overflow-y-auto bg-[var(--color-surface)] px-6 py-10 lg:w-[42%] lg:px-[52px]">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile brand (hidden on lg+) */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <svg width="32" height="32" viewBox="0 0 40 40" aria-hidden>
              <circle cx="20" cy="20" r="18" stroke="#735c00" strokeWidth="1.5" fill="none" />
              <path d="M14 26c2-3 4-5 6-5s4 2 6 5" stroke="#735c00" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="15" cy="16" r="1.4" fill="#735c00" />
              <circle cx="25" cy="16" r="1.4" fill="#735c00" />
            </svg>
            <span
              className="text-2xl font-bold text-[var(--color-on-surface)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Deer Planner
            </span>
          </div>

          <h1
            className="text-3xl font-bold leading-tight text-[var(--color-on-surface)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('login.title')}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-secondary)]">
            {t('login.subtitle')}
          </p>

          <form
            className="mt-8"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <FieldShell
              label={t('login.username')}
              htmlFor="username"
              required
              error={errors.username?.message}
              hint={t('login.usernameHint')}
            >
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="nombre@deer"
                invalid={Boolean(errors.username)}
                disabled={isLoading}
                {...register('username', {
                  required: t('login.errors.required'),
                  pattern: {
                    value: /^[a-z0-9._-]+@deer$/,
                    message: t('login.errors.usernameFormat'),
                  },
                })}
              />
            </FieldShell>

            <FieldShell
              label={t('login.password')}
              htmlFor="password"
              required
              error={errors.password?.message}
            >
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                invalid={Boolean(errors.password)}
                disabled={isLoading}
                {...register('password', {
                  required: t('login.errors.required'),
                })}
              />
            </FieldShell>

            <div className="mt-2 flex items-center justify-between gap-4">
              <p className="text-xs leading-relaxed text-[var(--color-secondary)]">
                {t('login.recoveryNote')}{' '}
                <a
                  href="mailto:admin@deer"
                  className="font-medium text-[var(--color-primary)] no-underline hover:underline"
                >
                  {t('login.recoveryLink')}
                </a>
                .
              </p>

              {/* Language pill toggle */}
              <div className="inline-flex overflow-hidden rounded-full border border-[var(--color-outline-variant)]">
                {(['en', 'es'] as const).map((lang, i) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguage(lang)}
                    className={`px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                      language === lang
                        ? 'bg-[var(--color-on-surface)] text-white'
                        : 'bg-transparent text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
                    } ${i > 0 ? 'border-l border-[var(--color-outline-variant)]' : ''}`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mt-4">
                <ErrorBanner>{error}</ErrorBanner>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="mt-6 h-12 w-full text-sm"
              data-testid="login-submit"
            >
              {isLoading ? t('login.submitting') : t('login.submit')}
            </Button>
          </form>

          {/* Helper callout */}
          <div className="mt-8 flex gap-3.5 rounded-lg border border-[var(--color-primary-fixed-dim)] bg-[var(--color-primary-fixed)]/40 p-4">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-container)] text-[11px] font-bold text-[var(--color-on-primary-container)]">
              i
            </div>
            <p className="text-xs leading-relaxed text-[var(--color-on-primary-fixed-variant)]">
              {t('login.helperCallout')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
