import { Link } from '@tanstack/react-router';
import { Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function NotFoundScreen(): React.ReactElement {
  const { t } = useTranslation('common');
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] p-8">
      <div className="max-w-md rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-10 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed-variant)]">
          <Compass className="h-5 w-5" />
        </div>
        <h1
          className="text-2xl font-bold text-[var(--color-on-surface)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          404
        </h1>
        <p className="mt-1 text-sm text-[var(--color-secondary)]">
          {t('app.title')} — {t('actions.empty')}
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-on-primary)] no-underline hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)]"
        >
          {t('actions.back')}
        </Link>
      </div>
    </main>
  );
}
