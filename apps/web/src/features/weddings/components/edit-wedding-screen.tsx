import { useNavigate, useParams } from '@tanstack/react-router';
import { type UpdateWeddingDto, type WeddingDto } from '@wendy/contracts';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useWeddingsService } from '../weddings.service';

import { NewWeddingForm } from './new-wedding-form';

interface ServerError {
  field?: string;
  message: string;
}

/**
 * Edit Wedding screen (US-010).
 *
 * Hosts the existing `NewWeddingForm` (the visual surface US-009 shipped)
 * with the five fields pre-populated from `GET /api/v1/weddings/{id}`.
 *
 * On a successful PATCH, navigates to the detail screen and passes the
 * updated payload via navigation state so the detail screen can render
 * the new values immediately while its on-mount GET is in flight
 * (the detail screen is the source of truth — the navigation-state
 * payload is only the optimistic fallback).
 *
 * The "fetch on mount" posture matches the detail screen: the edit
 * screen refuses to render the form until the server confirms the
 * caller is allowed to see the row. A 404 from the GET surfaces the
 * same generalized envelope every other unauthorized / missing case
 * uses — no enumeration.
 */
export function EditWeddingScreen(): React.ReactElement {
  const { t } = useTranslation('weddings');
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { weddingId?: string };
  const weddingId = params.weddingId ?? '';
  const service = useWeddingsService();

  const [wedding, setWedding] = useState<WeddingDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<ServerError | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setWedding(null);
    service
      .getWedding(weddingId)
      .then((data) => {
        if (!cancelled) setWedding(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : t('detailPlaceholder.errors.loadFailed');
          setLoadError(message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [weddingId, service, t]);

  if (loadError) {
    return (
      <main className="mx-auto w-full max-w-3xl px-10 py-12">
        <div
          role="alert"
          className="rounded border-l-4 border-[var(--color-destructive)] bg-[var(--color-muted)] px-4 py-3 text-sm text-[var(--color-foreground)]"
        >
          {loadError}
        </div>
        <button
          type="button"
          className="mt-6 text-sm font-semibold text-[var(--color-primary)] hover:underline"
          onClick={() =>
            void navigate({ to: '/dashboard/weddings/$weddingId', params: { weddingId } })
          }
        >
          ← {t('create.actions.cancel')}
        </button>
      </main>
    );
  }

  if (!wedding) {
    return (
      <main
        role="status"
        aria-live="polite"
        className="mx-auto w-full max-w-3xl px-10 py-12 text-sm text-[var(--color-secondary)]"
      >
        {t('detailPlaceholder.loading')}
      </main>
    );
  }

  const handleSubmit = async (dto: UpdateWeddingDto) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const updated: WeddingDto = await service.updateWedding(weddingId, dto);
      await navigate({
        to: '/dashboard/weddings/$weddingId',
        params: { weddingId: updated.id },
        state: { wedding: updated } as never,
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
    void navigate({
      to: '/dashboard/weddings/$weddingId',
      params: { weddingId },
    });
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-10 py-12">
      <header className="mb-8 space-y-2">
        <h1
          className="text-3xl font-semibold leading-tight text-[var(--color-tertiary)]"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          {t('edit.pageTitle')}
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-[var(--color-secondary)]">
          {t('edit.subtitle')}
        </p>
      </header>

      <NewWeddingForm
        isSubmitting={isSubmitting}
        serverError={serverError}
        initialValues={wedding}
        submitLabel={t('edit.actions.save')}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </main>
  );
}