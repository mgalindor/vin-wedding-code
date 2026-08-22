import { UserRole } from '@wendy/contracts';
import { useTranslation } from 'react-i18next';

import { WeddingsListSection } from '@/features/weddings/components/weddings-list-section';
import { useUserInfo } from '@/shared/auth/use-user-info';

/**
 * Dashboard index — drives the role-aware list surface (US-011).
 * The per-WP stats row remains unwired until US-021 lands.
 */
export function DashboardIndex(): React.ReactElement {
  const { t } = useTranslation('dashboard');
  const { data: profile } = useUserInfo();
  const callerRole: UserRole = profile?.role ?? UserRole.WeddingPlanner;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-10 py-8">
      <section aria-label={t('section.myWeddings')}>
        <p className="text-[12px] text-[var(--color-secondary)]">
          (Stats row — fully wired in US-021.)
        </p>
        <div className="mt-2" />
        <WeddingsListSection callerRole={callerRole} />
      </section>
    </div>
  );
}
