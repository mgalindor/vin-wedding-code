import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Compact language picker (EN / ES). Sidebar footer placement so it
 * stays reachable without adding a new row to the nav.
 *
 * The choice persists to a cookie via the i18n detector — the login
 * screen's pill toggle writes to the same cookie so post-login the
 * already-selected language is honoured immediately.
 */
export function LocaleSwitcher(): React.ReactElement {
  const { i18n, t } = useTranslation('common');

  const current = (i18n.language?.startsWith('es') ? 'es' : 'en') as 'en' | 'es';

  const change = (lang: 'en' | 'es') => {
    void i18n.changeLanguage(lang);
    // Mirror to cookie so the detector picks it up on refresh.
    if (typeof document !== 'undefined') {
      document.cookie = `i18next=${lang}; path=/; max-age=${60 * 60 * 24 * 365}`;
    }
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-0.5 text-[11px]">
      <Languages className="ml-1.5 h-3 w-3 text-[var(--color-secondary)]" aria-hidden />
      {(['en', 'es'] as const).map((lang) => {
        const active = current === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => change(lang)}
            aria-pressed={active}
            className={
              'rounded-full px-2.5 py-1 font-semibold uppercase tracking-wider transition-colors ' +
              (active
                ? 'bg-[var(--color-on-surface)] text-white'
                : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]')
            }
          >
            {lang.toUpperCase()}
          </button>
        );
      })}
      <span className="sr-only">{t('languageSwitcher.label')}</span>
    </div>
  );
}
