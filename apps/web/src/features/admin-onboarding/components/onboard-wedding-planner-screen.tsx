import { useNavigate } from '@tanstack/react-router';
import {
  type OnboardWeddingPlannerDto,
  type OnboardWeddingPlannerResponseDto,
} from '@wendy/contracts';
import { UserRole } from '@wendy/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoleGuard } from '@/shared/auth';

import { useWeddingPlannersService } from '../wedding-planners.service';

import { OnboardWeddingPlannerForm } from './onboard-wedding-planner-form';


interface ServerError {
  field?: string;
  message: string;
}

export function OnboardWeddingPlannerScreen(): React.ReactElement {
  const { t } = useTranslation('admin-onboarding');
  const navigate = useNavigate();
  const service = useWeddingPlannersService();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<ServerError | null>(null);

  // Rule 28 — server-authenticated role gate. The router-level
  // beforeLoad only checks that a token exists; the actual role check
  // runs here via /oauth/userinfo.
  useRoleGuard({ allow: [UserRole.Administrator] });

  const handleSubmit = async (dto: OnboardWeddingPlannerDto) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const response: OnboardWeddingPlannerResponseDto =
        await service.onboardWeddingPlanner(dto);
      await navigate({
        to: '/dashboard/wedding-planners/$plannerId/credentials',
        params: { plannerId: response.id },
        state: { credentials: response } as never,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('form.errors.generic');
      setServerError({ message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    void navigate({ to: '/dashboard' });
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-8 py-12">
      <header className="mb-8 space-y-2">
        <h1
          className="text-3xl font-semibold leading-tight text-[#1c1b1a]"
          style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '-0.02em' }}
        >
          {t('form.pageTitle')}
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-[#605e5c]">
          {t('form.subtitle')}
        </p>
      </header>

      <OnboardWeddingPlannerForm
        isSubmitting={isSubmitting}
        serverError={serverError}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </main>
  );
}