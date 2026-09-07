import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/shared/ui';
import { formatDateLong, getCountdown } from '@/shared/lib/format';

interface EventCountdownProps {
  iso: string;
  now?: Date;
}

/**
 * Visual countdown to the event date. Three presentations:
 *
 *   - Far future (> 30 days): single line "X meses · Y días" — high
 *     weight, low update cost. Skips the per-second interval.
 *   - Near future (≤ 30 days, including today): four stat blocks
 *     (days / hours / minutes / seconds) ticking every second.
 *   - Past: hides the numbers, shows "Celebrado el <long date>".
 *
 * Pure presentational: takes the ISO date, no fetching. The optional
 * `now` prop exists for deterministic tests; in production the
 * component falls back to `new Date()` and re-evaluates via
 * `setInterval(1000)` only when the countdown is ≤ 30 days.
 */
export function EventCountdown({ iso, now }: EventCountdownProps): React.ReactElement {
  const { t, i18n } = useTranslation('events');
  const locale = i18n.language?.startsWith('es') ? 'es' : 'en';

  const [tick, setTick] = useState(0);

  const countdown = useMemo(
    () => getCountdown(iso, now ?? new Date()),
    // `tick` is intentionally part of the deps: it forces a re-evaluation
    // every second so the displayed clock parts stay in sync.
    [iso, now, tick],
  );

  useEffect(() => {
    if (countdown.isPast) return undefined;
    if (countdown.totalDays > 30) return undefined;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [countdown.isPast, countdown.totalDays]);

  return (
    <div
      className="rounded-2xl border border-[var(--color-outline-variant)] bg-gradient-to-br from-[var(--color-primary-fixed-dim)]/10 to-[var(--color-tertiary-fixed-dim)]/10 p-5 md:p-6"
      data-testid="event-countdown"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)]">
        {t('detail.countdown.eyebrow')}
      </p>

      {countdown.isPast ? (
        <p className="mt-3 text-base font-medium text-[var(--color-on-surface)]">
          {t('detail.countdown.past', { date: formatDateLong(iso, locale) })}
        </p>
      ) : countdown.totalDays > 30 ? (
        <p
          className="mt-3 text-2xl font-bold tabular-nums text-[var(--color-on-surface)]"
          aria-label={t('detail.countdown.ariaLabel', {
            days: countdown.totalDays,
            hours: countdown.hours,
            minutes: countdown.minutes,
            seconds: countdown.seconds,
          })}
        >
          <span aria-hidden="true">
            {countdown.months} {t('detail.countdown.units.months')}
            <span className="mx-2 text-[var(--color-secondary)]">·</span>
            {countdown.days} {t('detail.countdown.units.days')}
          </span>
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {countdown.isToday ? (
            <Badge tone="gold" data-testid="event-countdown-today-badge">
              {t('detail.countdown.todayBadge')}
            </Badge>
          ) : null}
          <div
            role="timer"
            aria-live="polite"
            aria-atomic="true"
            aria-label={t('detail.countdown.ariaLabel', {
              days: countdown.days,
              hours: countdown.hours,
              minutes: countdown.minutes,
              seconds: countdown.seconds,
            })}
            className="grid grid-cols-2 gap-4 md:grid-cols-4"
          >
            <CountdownUnit
              value={countdown.days}
              label={t('detail.countdown.units.days')}
              testId="event-countdown-days"
            />
            <CountdownUnit
              value={countdown.hours}
              label={t('detail.countdown.units.hours')}
              testId="event-countdown-hours"
            />
            <CountdownUnit
              value={countdown.minutes}
              label={t('detail.countdown.units.minutes')}
              testId="event-countdown-minutes"
            />
            <CountdownUnit
              value={countdown.seconds}
              label={t('detail.countdown.units.seconds')}
              testId="event-countdown-seconds"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CountdownUnit({
  value,
  label,
  testId,
}: {
  value: number;
  label: string;
  testId: string;
}): React.ReactElement {
  return (
    <div className="flex flex-col items-start" data-testid={testId}>
      <span
        aria-hidden="true"
        className="text-3xl font-bold tabular-nums text-[var(--color-on-surface)] md:text-4xl"
      >
        {value}
      </span>
      <span className="mt-1 text-xs uppercase tracking-wider text-[var(--color-secondary)]">
        {label}
      </span>
    </div>
  );
}