import { useNavigate } from '@tanstack/react-router';
import type { WeddingPlannerSummaryDto } from '@wendy/contracts';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui/button';

import { useWeddingPlannersService } from '../wedding-planners.service';

import { WeddingPlannersList } from './wedding-planners-list';

type FetchState =
  | { status: 'loading' }
  | { status: 'success'; rows: WeddingPlannerSummaryDto[] }
  | { status: 'error'; message: string };

export function WeddingPlannersLandingCard(): React.ReactElement {
  const { t } = useTranslation('admin-onboarding');
  const navigate = useNavigate();
  const service = useWeddingPlannersService();
  const [state, setState] = useState<FetchState>({ status: 'loading' });

  // useApiClient returns a fresh service every render, so depending on
  // it in the effect would re-fire the fetch each render and loop. The
  // ref captures the latest service while the effect stays mount-only.
  const serviceRef = useRef(service);
  serviceRef.current = service;

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setState({ status: 'loading' });
      try {
        const rows = await serviceRef.current.listWeddingPlanners();
        if (!cancelled) {
          setState({ status: 'success', rows });
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : t('directory.errorBanner');
          setState({ status: 'error', message });
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const goToOnboarding = () => {
    void navigate({ to: '/dashboard/wedding-planners/onboard' });
  };

  if (state.status === 'error') {
    return (
      <section
        data-testid="wedding-planners-error"
        aria-label={t('directory.sectionTitle')}
        className="w-full"
      >
        <div
          role="alert"
          className="rounded border-l-4 border-[#b3261e] bg-[#fdecea] px-4 py-3 text-sm leading-relaxed text-[#5f0e0a]"
        >
          {state.message}
        </div>
      </section>
    );
  }

  if (state.status === 'loading') {
    return (
      <section
        data-testid="wedding-planners-loading"
        aria-label={t('directory.loading')}
        className="w-full"
      >
        <div
          aria-hidden="true"
          className="mb-6 h-7 w-1/3 animate-pulse rounded bg-[#e3e1e0]"
        />
        <div
          aria-hidden="true"
          className="mb-2 h-4 w-1/2 animate-pulse rounded bg-[#e3e1e0]"
        />
        <div
          aria-hidden="true"
          className="mt-6 h-12 w-full animate-pulse rounded-lg bg-[#e3e1e0]"
        />
        <div
          aria-hidden="true"
          className="mt-2 h-12 w-full animate-pulse rounded-lg bg-[#e3e1e0]"
        />
      </section>
    );
  }

  if (state.rows.length === 0) {
    return (
      <div
        data-testid="wedding-planners-empty-state"
        className="w-full"
      >
        <header className="mb-6">
          <h1
            className="text-[28px] font-bold text-[#1c1b1a]"
            style={{
              fontFamily: 'Playfair Display, serif',
              letterSpacing: '-0.02em',
            }}
          >
            {t('directory.sectionTitle')}
          </h1>
          <p className="mt-1 text-sm text-[#605e5c]">
            {t('directory.subtitle')}
          </p>
        </header>

        <div className="rounded-lg border bg-white p-12 text-left" style={{ borderColor: '#e3e1e0' }}>
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
              onClick={goToOnboarding}
              data-testid="wedding-planners-empty-state-onboard-cta"
            >
              + {t('landing.primaryAction')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section aria-label={t('directory.sectionTitle')}>
      <WeddingPlannersList rows={state.rows} onOnboardClick={goToOnboarding} />
    </section>
  );
}