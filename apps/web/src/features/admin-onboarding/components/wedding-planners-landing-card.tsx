import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui/button';

export function WeddingPlannersLandingCard(): React.ReactElement {
  const { t } = useTranslation('admin-onboarding');
  const navigate = useNavigate();

  return (
    <div
      className="mt-10 w-full max-w-2xl rounded-lg border bg-white p-8 text-left"
      style={{ borderColor: '#e3e1e0' }}
    >
      <h2
        className="text-2xl font-bold text-[#1c1b1a]"
        style={{
          fontFamily: 'Playfair Display, serif',
          letterSpacing: '-0.02em',
        }}
      >
        {t('landing.emptyTitle')}
      </h2>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-[#605e5c]">
        {t('landing.emptyBody')}
      </p>
      <div className="mt-5">
        <Button
          type="button"
          variant="default"
          onClick={() => void navigate({ to: '/dashboard/wedding-planners/onboard' })}
        >
          + {t('landing.primaryAction')}
        </Button>
      </div>
    </div>
  );
}