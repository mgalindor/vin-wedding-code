import i18n from 'i18next';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui/button';

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
  const current: SupportedLocale = isSupported(instance.language) ? instance.language : 'en';
  const next: SupportedLocale = current === 'en' ? 'es' : 'en';

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <span className="text-sm text-muted-foreground">{t('dashboard.languageSwitcher.label')}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => changeLocale(next)}
        aria-label={t('dashboard.languageSwitcher.label')}
      >
        {current === 'en'
          ? t('dashboard.languageSwitcher.english')
          : t('dashboard.languageSwitcher.spanish')}
      </Button>
    </div>
  );
}

export default LocaleSwitcher;