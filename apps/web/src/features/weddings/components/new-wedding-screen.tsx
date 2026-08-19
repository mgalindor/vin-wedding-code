import { useNavigate } from '@tanstack/react-router';
import { type CreateWeddingDto, type WeddingDto } from '@wendy/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useWeddingsService } from '../weddings.service';

import { NewWeddingForm } from './new-wedding-form';

interface ServerError {
  field?: string;
  message: string;
}

/**
 * New Wedding screen (US-009).
 *
 * Hosts the `NewWeddingForm` and orchestrates the POST against
 * `/api/v1/weddings`. On success, navigates to the detail placeholder
 * (`/dashboard/weddings/{weddingId}`) and passes the create response
 * via navigation state so the detail placeholder can render without
 * a follow-up GET (US-010 ships the read endpoint).
 */
export function NewWeddingScreen(): React.ReactElement {
  const { t } = useTranslation('weddings');
  const navigate = useNavigate();
  const service = useWeddingsService();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<ServerError | null>(null);

  const handleSubmit = async (dto: CreateWeddingDto) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const response: WeddingDto = await service.createWedding(dto);
      await navigate({
        to: '/dashboard/weddings/$weddingId',
        params: { weddingId: response.id },
        state: { wedding: response } as never,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('create.errors.submitFailed');
      setServerError({ message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    void navigate({ to: '/dashboard' });
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-10 py-12">
      <header className="mb-8 space-y-2">
        <h1
          className="text-3xl font-semibold leading-tight text-[var(--color-tertiary)]"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          {t('create.pageTitle')}
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-[var(--color-secondary)]">
          {t('create.subtitle')}
        </p>
      </header>

      <NewWeddingForm
        isSubmitting={isSubmitting}
        serverError={serverError}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </main>
  );
}