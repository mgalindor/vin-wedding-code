import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import auth from './locales/en/auth.json';
import common from './locales/en/common.json';
import dashboard from './locales/en/dashboard.json';
import errors from './locales/en/errors.json';
import events from './locales/en/events.json';
import guests from './locales/en/guests.json';
import invitations from './locales/en/invitations.json';
import profile from './locales/en/profile.json';
import users from './locales/en/users.json';

import authEs from './locales/es/auth.json';
import commonEs from './locales/es/common.json';
import dashboardEs from './locales/es/dashboard.json';
import errorsEs from './locales/es/errors.json';
import eventsEs from './locales/es/events.json';
import guestsEs from './locales/es/guests.json';
import invitationsEs from './locales/es/invitations.json';
import profileEs from './locales/es/profile.json';
import usersEs from './locales/es/users.json';

/**
 * i18n setup, per ADR-08.
 *
 * Detection order:
 *   1. Explicit user choice persisted to a cookie by the locale pill in
 *      the login screen + the sidebar switcher.
 *   2. `Accept-Language` header (mapped by the browser-language detector).
 *   3. Default to `en`.
 *
 * Each namespace is a separate JSON file — keeps PR diffs surgical and
 * makes the i18n audit trivial.
 */
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'es'],
    ns: [
      'common',
      'auth',
      'dashboard',
      'events',
      'guests',
      'invitations',
      'profile',
      'users',
      'errors',
    ],
    defaultNS: 'common',
    detection: {
      order: ['cookie', 'navigator', 'htmlTag'],
      lookupCookie: 'i18next',
      caches: ['cookie'],
      cookieMinutes: 60 * 24 * 365,
    },
    interpolation: {
      // React already escapes by default when using JSX; keep this off
      // so `<strong>name</strong>` patterns render correctly.
      escapeValue: false,
    },
    resources: {
      en: {
        common,
        auth,
        dashboard,
        errors,
        events,
        guests,
        invitations,
        profile,
        users,
      },
      es: {
        common,
        auth: authEs,
        dashboard: dashboardEs,
        errors: errorsEs,
        events: eventsEs,
        guests: guestsEs,
        invitations: invitationsEs,
        profile: profileEs,
        users: usersEs,
      },
    },
  });

export default i18n;
