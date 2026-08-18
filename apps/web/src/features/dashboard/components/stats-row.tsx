import { useTranslation } from 'react-i18next';

export interface WeddingStats {
  readonly activeWeddings: number;
  readonly activeWeddingsSubCount: number;
  readonly totalGuests: number;
  readonly totalGuestsSubCount: number;
  readonly confirmedRsvps: number;
  readonly confirmedRsvpsRate: number;
  readonly daysToNext: number | null;
  readonly daysToNextCouple: string | null;
  readonly daysToNextDate: string | null;
}

export function StatsRow({
  stats,
}: {
  stats: WeddingStats;
}): React.ReactElement {
  const { t } = useTranslation('dashboard');

  return (
    <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label={t('stats.activeWeddings')}
        value={String(stats.activeWeddings)}
        sub={t('stats.activeWeddingsSub', { count: stats.activeWeddingsSubCount })}
      />
      <StatCard
        label={t('stats.totalGuests')}
        value={String(stats.totalGuests)}
        sub={t('stats.totalGuestsSub', { count: stats.totalGuestsSubCount })}
      />
      <StatCard
        label={t('stats.confirmedRsvps')}
        value={String(stats.confirmedRsvps)}
        sub={t('stats.confirmedRsvpsSub', { rate: stats.confirmedRsvpsRate })}
        valueColor="var(--color-status-confirmed-text)"
      />
      <StatCard
        label={t('stats.daysToNext')}
        value={stats.daysToNext === null ? '—' : String(stats.daysToNext)}
        sub={
          stats.daysToNextCouple && stats.daysToNextDate
            ? t('stats.daysToNextSub', {
                couple: stats.daysToNextCouple,
                date: stats.daysToNextDate,
              })
            : '—'
        }
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
}): React.ReactElement {
  return (
    <div
      className="rounded-lg border bg-[var(--color-surface-container-lowest)] px-6 py-5 transition-shadow"
      style={{
        borderColor: 'var(--color-outline-variant)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <span
        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-secondary)]"
      >
        {label}
      </span>
      <div
        className="text-[36px] font-bold leading-none tracking-[-0.02em]"
        style={{
          color: valueColor ?? 'var(--color-primary)',
          fontFamily: 'var(--font-display)',
        }}
      >
        {value}
      </div>
      <div className="mt-1.5 text-[12px] text-[var(--color-secondary)]">
        {sub}
      </div>
    </div>
  );
}
