import { useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { useWeddingForTab } from '../hooks/use-wedding-for-tab';

import { DetailScreenShell } from './detail-screen-shell';
import { WeddingDetailLayout, type WeddingTabKey } from './wedding-detail-layout';

/**
 * Generic disabled-tab screen.
 *
 * US-010 scope: the Guests / Photos / Invitation tabs each own a
 * story that will replace this placeholder when those stories land
 * (US-015+, US-030+, US-022/023/024). The screen shows a localized
 * "coming soon" message so the WP understands the tab is intentional
 * and not a broken navigation.
 */
export function WeddingDisabledTabScreen({
  tab,
  titleKey,
  comingInKey,
  descriptionKey,
}: {
  tab: WeddingTabKey;
  titleKey: string;
  comingInKey: string;
  descriptionKey: string;
}): React.ReactElement {
  const { t } = useTranslation('weddings');
  const params = useParams({ strict: false }) as { weddingId?: string };
  const weddingId = params.weddingId ?? '';

  const { wedding, loadError } = useWeddingForTab(weddingId);

  return (
    <DetailScreenShell
      wedding={wedding}
      loadError={loadError}
      loadingLabel={t('detailPlaceholder.loading')}
    >
      {(w) => (
        <WeddingDetailLayout wedding={w} activeTab={tab}>
          <div className="px-10 py-8">
          <section
            data-testid={`wedding-disabled-tab-${tab}`}
            className="rounded-xl border border-dashed border-[var(--color-outline-variant)] bg-[var(--color-muted)] p-12 text-center"
          >
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-secondary)]">
              {t(titleKey)}
            </h2>
            <span className="mt-4 inline-flex items-center rounded-full border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--color-secondary)]">
              {t(comingInKey)}
            </span>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[var(--color-secondary)]">
              {t(descriptionKey)}
            </p>
          </section>
          </div>
        </WeddingDetailLayout>
      )}
    </DetailScreenShell>
  );
}
