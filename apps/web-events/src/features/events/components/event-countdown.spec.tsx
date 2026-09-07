import { describe, expect, it, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';

import { EventCountdown } from '@/features/events/components/event-countdown';

const enResources = {
  events: {
    detail: {
      countdown: {
        eyebrow: 'Countdown',
        todayBadge: "It's today!",
        past: 'Celebrated on {{date}}',
        ariaLabel: '{{days}} days, {{hours}} hours, {{minutes}} minutes and {{seconds}} seconds remaining',
        units: {
          months: 'months',
          weeks: 'weeks',
          days: 'days',
          hours: 'hours',
          minutes: 'minutes',
          seconds: 'seconds',
        },
      },
    },
  },
};

const esResources = {
  events: {
    detail: {
      countdown: {
        eyebrow: 'Cuenta regresiva',
        todayBadge: '¡Es hoy!',
        past: 'Celebrado el {{date}}',
        ariaLabel: 'Faltan {{days}} días, {{hours}} horas, {{minutes}} minutos y {{seconds}} segundos',
        units: {
          months: 'meses',
          weeks: 'semanas',
          days: 'días',
          hours: 'horas',
          minutes: 'minutos',
          seconds: 'segundos',
        },
      },
    },
  },
};

function renderWithI18n(node: React.ReactNode, locale: 'en' | 'es') {
  return render(
    <I18nextProvider i18n={i18n}>
      {node}
    </I18nextProvider>,
  );
}

beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    resources: { en: enResources, es: esResources },
    lng: 'en',
    fallbackLng: 'en',
    ns: ['events'],
    defaultNS: 'events',
    interpolation: { escapeValue: false },
  });
});

describe('EventCountdown', () => {
  it('renders the months/days headline for a far-future date', () => {
    const now = new Date(2026, 0, 1, 12, 0, 0); // 2026-01-01
    renderWithI18n(<EventCountdown iso="2026-04-11" now={now} />, 'en');

    expect(screen.getByTestId('event-countdown')).toHaveTextContent('Countdown');
    // 100 days = 3 months + 1 week + 3 days
    expect(screen.getByTestId('event-countdown')).toHaveTextContent(/3\s+months/);
    expect(screen.getByTestId('event-countdown')).toHaveTextContent(/3\s+days/);
  });

  it('renders the four-block grid for a near-future date', () => {
    const now = new Date(2026, 5, 10, 9, 30, 45); // 2026-06-10 09:30:45
    renderWithI18n(<EventCountdown iso="2026-06-13" now={now} />, 'en');

    const timer = screen.getByRole('timer');
    expect(timer).toBeInTheDocument();
    expect(timer).toHaveAttribute('aria-live', 'polite');
    expect(timer).toHaveAttribute('aria-atomic', 'true');

    expect(screen.getByTestId('event-countdown-days')).toHaveTextContent('3');
    expect(screen.getByTestId('event-countdown-hours')).toHaveTextContent('9');
    expect(screen.getByTestId('event-countdown-minutes')).toHaveTextContent('30');
    expect(screen.getByTestId('event-countdown-seconds')).toHaveTextContent('45');
  });

  it('renders the today badge for an event happening today', () => {
    const now = new Date(2026, 7, 14, 18, 0, 0); // 2026-08-14
    renderWithI18n(<EventCountdown iso="2026-08-14" now={now} />, 'en');

    const badge = screen.getByTestId('event-countdown-today-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("It's today!");
  });

  it('hides the numeric blocks and shows the long date when the event is past', () => {
    const now = new Date(2026, 7, 14, 10, 0, 0); // 2026-08-14
    renderWithI18n(<EventCountdown iso="2026-08-13" now={now} />, 'en');

    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    // The "past" copy + the long date string for 2026-08-13.
    expect(screen.getByTestId('event-countdown')).toHaveTextContent(/Celebrated on/);
    expect(screen.getByTestId('event-countdown')).toHaveTextContent(/August/);
  });
});