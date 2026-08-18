import i18n from 'i18next';
import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/lib/utils';

const SUPPORTED_LOCALES = ['en', 'es'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const COOKIE_NAME = 'wendy_locale';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function isSupported(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

function writeLocaleCookie(locale: SupportedLocale): void {
  document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

function changeLocale(next: SupportedLocale): void {
  void i18n.changeLanguage(next);
  writeLocaleCookie(next);
}

export function LocaleSwitcher(): React.ReactElement {
  const { t, i18n: instance } = useTranslation('common');
  const current: SupportedLocale = isSupported(instance.language)
    ? instance.language
    : 'en';

  return (
    <div
      className="inline-flex overflow-hidden rounded-full border"
      style={{ borderColor: 'var(--color-outline-variant)' }}
      role="group"
      aria-label={t('languageSwitcher.label')}
    >
      {SUPPORTED_LOCALES.map((locale, index) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => changeLocale(locale)}
            aria-pressed={active}
            aria-label={t(`languageSwitcher.${locale}`)}
            className={cn(
              'px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors',
              index > 0 && 'border-l',
              active
                ? 'bg-[var(--color-on-surface)] text-[var(--color-surface)]'
                : 'bg-transparent text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)]',
            )}
            style={{
              borderColor: 'var(--color-outline-variant)',
            }}
          >
            {locale.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

export default LocaleSwitcher;