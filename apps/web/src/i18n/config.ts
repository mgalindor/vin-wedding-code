import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enAdminOnboarding from './locales/en/admin-onboarding.json';
import enAuth from './locales/en/auth.json';
import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import esAdminOnboarding from './locales/es/admin-onboarding.json';
import esAuth from './locales/es/auth.json';
import esCommon from './locales/es/common.json';
import esDashboard from './locales/es/dashboard.json';

// Detection order: cookie (wendy_locale) → navigator → fallback 'en'.
// Locale choice persists in a cookie so it survives reloads and cross-device login.
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        auth: enAuth,
        dashboard: enDashboard,
        'admin-onboarding': enAdminOnboarding,
      },
      es: {
        common: esCommon,
        auth: esAuth,
        dashboard: esDashboard,
        'admin-onboarding': esAdminOnboarding,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard', 'admin-onboarding'],
    supportedLngs: ['en', 'es'],
    detection: {
      order: ['cookie', 'navigator'],
      lookupCookie: 'wendy_locale',
      caches: ['cookie'],
      cookieMinutes: 60 * 24 * 365,
    },
    interpolation: {
      escapeValue: false,
    },
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (_lngs, _ns, key) => {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] Missing translation key: ${key}`);
      }
    },
  });

export { i18n };
export default i18n;