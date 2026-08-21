/**
 * ListStateCard — single-card placeholder rendered INSIDE the
 * wedding-card grid when the list is empty.
 *
 * The card mirrors the size and rhythm of a real `WeddingCard`
 * so the page layout does not jump between "has rows" and "no
 * rows" — chips, sort, search input, and grid columns all stay
 * exactly where they were. The card carries:
 *  - a friendly heading + helper copy
 *  - a "+ New Wedding" action in BOTH the empty and the
 *    no-matches states (the WP always has a way to add a wedding)
 *  - the same status pill slot a real card would have, so the
 *    header band keeps its proportions
 *
 * US-011 — replaces the previous centered "full-width" panel
 * that hid the chrome.
 */
import { useTranslation } from 'react-i18next';

export type ListStateKind = 'empty' | 'noMatches';

export interface ListStateCardProps {
  readonly kind: ListStateKind;
}

export function ListStateCard({
  kind,
}: ListStateCardProps): React.ReactElement {
  const { t } = useTranslation('dashboard');
  const titleKey =
    kind === 'empty' ? 'list.empty.title' : 'list.noMatches.title';
  const bodyKey =
    kind === 'empty' ? 'list.empty.body' : 'list.noMatches.body';

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="list-state-grid"
    >
      <article
        className="flex flex-col rounded-lg border bg-[var(--color-surface-container-lowest)]"
        style={{ borderColor: 'var(--color-outline-variant)' }}
        data-testid={
          kind === 'empty' ? 'list-empty-state' : 'list-no-matches-state'
        }
      >
        <div
          className="flex items-center justify-between border-b px-5 py-3"
          style={{ borderColor: 'var(--color-outline-variant)' }}
        >
          <span
            className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em]"
            style={{
              background: 'var(--color-surface-container-high)',
              color: 'var(--color-secondary)',
            }}
          >
            {kind === 'empty'
              ? t('list.card.statusDraft')
              : t('list.card.statusArchived')}
          </span>
          <span
            aria-hidden="true"
            className="text-[18px]"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-primary)',
            }}
          >
            ♡
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-3 px-5 py-4">
          <h3
            className="text-[18px] font-semibold leading-tight"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-on-surface)',
            }}
          >
            {t(titleKey)}
          </h3>
          <p
            className="text-[13px]"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            {t(bodyKey)}
          </p>
          <div className="mt-auto pt-2">
            <a
              href="/dashboard/weddings/new"
              className="inline-block rounded px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.04em] transition-opacity hover:opacity-90"
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-primary-foreground)',
                fontFamily: 'var(--font-sans)',
                textDecoration: 'none',
              }}
              data-testid="list-state-create-link"
            >
              {t('list.empty.action')}
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}
