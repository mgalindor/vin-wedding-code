import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { AuthenticateUserDto } from '@wendy/contracts';
import { useAuth, useLogin } from '@/shared/auth';

/**
 * Split-panel login screen: brand on the left, form on the right.
 * On success, auth state is updated and the user is redirected to /dashboard.
 */
export function LoginScreen(): React.ReactElement {
  const { t, i18n } = useTranslation('auth');
  const navigate = useNavigate({ from: '/login' });
  const { state } = useAuth();
  const { login, isLoading, error: loginError } = useLogin();
  const [language, setLanguage] = useState<'en' | 'es'>(
    i18n.language === 'es' ? 'es' : 'en',
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthenticateUserDto>({
    mode: 'onSubmit',
    defaultValues: {
      grant_type: 'password',
      username: '',
      password: '',
    },
  });

  // If already authenticated, send to dashboard.
  useEffect(() => {
    if (state.isAuthenticated) {
      void navigate({ to: '/dashboard' });
    }
  }, [state.isAuthenticated, navigate]);

  const onSubmit = async (dto: AuthenticateUserDto) => {
    try {
      await login(dto);
      // After successful login, the auth state changes and useEffect redirects to /dashboard
    } catch {
      // Error is handled by the useLogin hook and displayed in the form
    }
  };

  const handleLanguageChange = (lang: 'en' | 'es') => {
    setLanguage(lang);
    void i18n.changeLanguage(lang);
  };

  return (
    <div className="flex min-h-screen bg-[#f9f8f7]">
      {/* ===== LEFT PANEL — Dark brand panel ===== */}
      <div
        className="relative w-[58%] flex flex-col px-[52px] py-[40px]"
        style={{
          background:
            'linear-gradient(155deg, #1c1a00 0%, #2d2900 45%, #1a1600 80%, #0f0d00 100%)',
        }}
      >
        {/* Texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 80% 20%, rgba(115,92,0,0.18) 0%, transparent 60%)',
          }}
        />

        {/* Brand */}
        <div className="relative z-10">
          <div
            className="text-[36px] font-bold text-[#e9c349] leading-none"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Wendy
          </div>
          <div className="text-[11px] font-semibold tracking-widest text-white text-opacity-35 uppercase mt-2">
            Planner · A Vineyards Tool
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Tagline */}
        <div
          className="relative z-10 text-white text-[42px] font-bold leading-[1.18] max-w-[440px]"
          style={{
            fontFamily: 'Playfair Display, serif',
            letterSpacing: '-0.02em',
          }}
        >
          One tool for the entire wedding lifecycle.
        </div>

        {/* Footer text */}
        <div className="relative z-10 text-[12px] text-white text-opacity-28 leading-relaxed mt-[20px]">
          Bilingual UI · EN default · ES auto-detected from your browser.
          <br />
          PC &amp; tablet optimized.
        </div>
      </div>

      {/* ===== RIGHT PANEL — Form ===== */}
      <div className="flex-1 flex flex-col px-[52px] py-[40px] overflow-y-auto">
        <h1
          className="text-[36px] font-bold text-[#1c1b1a] mb-1.5"
          style={{
            fontFamily: 'Playfair Display, serif',
            letterSpacing: '-0.02em',
          }}
        >
          {t('login.title')}
        </h1>
        <p className="text-[14px] text-[#605e5c] mb-8 leading-relaxed">
          Enter your <code className="text-[13px] bg-[#eeeceb] px-1.5 py-0.5 rounded text-[#4d4635] font-mono">
            nombre@wendy
          </code>{' '}
          credentials.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1">
          {/* Username Field */}
          <div className="mb-5">
            <label
              htmlFor="username"
              className="block text-[13px] font-semibold text-[#1c1b1a] mb-1"
            >
              {t('login.username')}
            </label>
            <input
              id="username"
              type="text"
              placeholder={t('login.username_placeholder')}
              disabled={isLoading}
              autoComplete="username"
              className="w-full px-4 py-3 text-[14px] border border-[#d0c5af] rounded bg-white text-[#1c1b1a] placeholder-[#a89f8f] focus:outline-none focus:ring-2 focus:ring-[#735c00]"
              {...register('username', {
                required: t('login.errors.required'),
                pattern: {
                  value: /^[a-z]+@wendy$/,
                  message: t('login.errors.format'),
                },
              })}
            />
            {errors.username && (
              <p className="text-[12px] text-[#ba1a1a] mt-1">
                {errors.username.message}
              </p>
            )}
            <p className="text-[12px] text-[#605e5c] mt-1">
              Format:{' '}
              <code className="bg-[#eeeceb] px-1 py-0.5 rounded text-[#4d4635] font-mono">
                nombre@wendy
              </code>
            </p>
          </div>

          {/* Password Field */}
          <div className="mb-5">
            <label
              htmlFor="password"
              className="block text-[13px] font-semibold text-[#1c1b1a] mb-1"
            >
              {t('login.password')}
            </label>
            <input
              id="password"
              type="password"
              placeholder={t('login.password_placeholder')}
              disabled={isLoading}
              autoComplete="current-password"
              className="w-full px-4 py-3 text-[14px] border border-[#d0c5af] rounded bg-white text-[#1c1b1a] placeholder-[#a89f8f] focus:outline-none focus:ring-2 focus:ring-[#735c00]"
              {...register('password', {
                required: t('login.errors.required'),
                minLength: {
                  value: 1,
                  message: t('login.errors.required'),
                },
              })}
            />
            {errors.password && (
              <p className="text-[12px] text-[#ba1a1a] mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Recovery note */}
          <p className="text-[12px] text-[#605e5c] leading-relaxed mb-6">
            No self-service password recovery in MVP —{' '}
            <a href="#" className="text-[#735c00] no-underline hover:underline">
              contact your admin
            </a>
            .
          </p>

          {/* Language toggle pill */}
          <div className="flex border-[1.5px] border-[#d0c5af] rounded-full overflow-hidden mb-6 w-fit">
            <button
              type="button"
              className={`px-3.5 py-1.5 text-[12px] font-semibold tracking-wider uppercase transition-all ${
                language === 'en'
                  ? 'bg-[#1c1b1a] text-[#f9f8f7]'
                  : 'bg-none text-[#605e5c] hover:text-[#735c00]'
              }`}
              onClick={() => handleLanguageChange('en')}
            >
              EN
            </button>
            <div className="text-[12px] text-[#d0c5af] pointer-events-none px-1">
              /
            </div>
            <button
              type="button"
              className={`px-3.5 py-1.5 text-[12px] font-semibold tracking-wider uppercase transition-all ${
                language === 'es'
                  ? 'bg-[#1c1b1a] text-[#f9f8f7]'
                  : 'bg-none text-[#605e5c] hover:text-[#735c00]'
              }`}
              onClick={() => handleLanguageChange('es')}
            >
              ES
            </button>
          </div>

          {/* Error box */}
          {loginError && (
            <div className="bg-[#ffdad6] text-[#5a3535] border-l-4 border-[#ba1a1a] rounded px-4 py-3 text-[13px] mb-5">
              {loginError}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-4 text-[13px] font-semibold tracking-widest uppercase bg-[#735c00] text-white rounded hover:bg-[#554300] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-6"
          >
            {isLoading ? '⏳ Signing in...' : t('login.submit')}
          </button>
        </form>

        {/* Info note */}
        <div className="bg-[#ffe088] rounded-lg px-4.5 py-4 flex gap-3.5 items-start">
          <div className="w-5 h-5 flex-shrink-0 bg-[#d4af37] rounded-full flex items-center justify-center text-[11px] font-bold text-[#554300]">
            i
          </div>
          <p className="text-[13px] text-[#574500] leading-relaxed">
            If login fails, verify that your username follows the format{' '}
            <strong>nombre@wendy</strong> and that Caps Lock is off. Passwords
            are case-sensitive. If the problem persists, contact your{' '}
            <strong>Administrator</strong> — there is no self-service password
            recovery in this version.
          </p>
        </div>
      </div>
    </div>
  );
}
