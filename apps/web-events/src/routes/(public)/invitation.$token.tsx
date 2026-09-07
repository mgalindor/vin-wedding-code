import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import {
  ApiError,
  isApiError,
  useApiClient,
  type PublicInvitationDto,
} from '@/shared/api';

import {
  PublicInvitationPage,
  resolvePublicLocale,
  mapPublicInvitationDtoToData,
  isInvitationActive,
} from '@/features/invitations/public';
import { getTemplateEntry } from '@/features/invitations/public/registry';
import { buildSampleInvitation } from '@/features/invitations/public/sample-data';
import type { PublicInvitationData } from '@/features/invitations/public/types';

/**
 * Guest-facing invitation route.
 *
 * URL contract:
 *   - `/i/{slug}`           → real invitation served by the BE
 *   - `/i/preview-{code}`   → QA preview with sample data (no BE call)
 *
 * When the token matches a registered template code (`/{code}`,
 * `preview-{code}`, etc.) we render with sample data and skip the BE —
 * this is the dev-time path that still works without a backend.
 *
 * For any other token we hit `GET /api/v1/public/invitations/{slug}`
 * (no auth). The BE returns the event + template + wedding detail; we
 * map the DTO into the per-eventType `PublicInvitationData` shape that
 * the 27 templates consume.
 */
export function PublicInvitationPlaceholderScreen(): ReactElement {
  const params = useParams({ strict: false }) as { token?: string };
  const token = params.token ?? '';
  const api = useApiClient();

  const isPreviewToken = token.startsWith('preview-');
  const templateCodeFromUrl = isPreviewToken ? token.slice('preview-'.length) : null;
  const registeredEntry = templateCodeFromUrl ? getTemplateEntry(templateCodeFromUrl) : null;

  if (isPreviewToken || registeredEntry) {
    return <PreviewPath token={token} templateCodeFromUrl={templateCodeFromUrl} />;
  }

  return <LivePath token={token} api={api} />;
}

// ---------------------------------------------------------------------------
// Preview path (dev-only, sample data)
// ---------------------------------------------------------------------------

function PreviewPath({
  token,
  templateCodeFromUrl,
}: {
  token: string;
  templateCodeFromUrl: string | null;
}): ReactElement {
  const [rsvpSubmitted, setRsvpSubmitted] = useState<boolean>(false);

  const data = useMemo<PublicInvitationData | null>(() => {
    if (!templateCodeFromUrl) return null;
    return buildSampleInvitation({ templateCode: templateCodeFromUrl, locale: 'es' });
  }, [templateCodeFromUrl]);

  if (!data) {
    return <UnknownInvitation token={token} locale="es" />;
  }

  return (
    <main>
      {rsvpSubmitted ? (
        <RsvpThankYou data={data} />
      ) : (
        <PublicInvitationPage
          data={data}
          token={token}
          onRsvpClick={() => setRsvpSubmitted(true)}
        />
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Live path (calls the BE)
// ---------------------------------------------------------------------------

function LivePath({
  token,
  api,
}: {
  token: string;
  api: ReturnType<typeof useApiClient>;
}): ReactElement {
  const { i18n } = useTranslation();
  const [rsvpSubmitted, setRsvpSubmitted] = useState<boolean>(false);

  const locale = resolvePublicLocale(
    undefined,
    i18n.language,
    typeof navigator !== 'undefined' ? navigator.language : undefined,
  );

  const query = useQuery<PublicInvitationDto>({
    queryKey: ['public-invitation', token, locale],
    queryFn: () => api.get<PublicInvitationDto>(`/public/invitations/${encodeURIComponent(token)}`),
    retry: (failureCount, error) => {
      if (isApiError(error) && (error.status === 404 || error.status === 410)) return false;
      return failureCount < 2;
    },
    staleTime: 30_000,
  });

  if (query.isLoading) {
    return <LoadingState locale={locale} />;
  }

  if (query.isError) {
    if (isApiError(query.error)) {
      if (query.error.status === 404 || query.error.status === 410) {
        return <UnknownInvitation token={token} locale={locale} />;
      }
      return <ErrorState message={query.error.message} traceId={query.error.traceId} locale={locale} />;
    }
    return <ErrorState message={String(query.error)} locale={locale} />;
  }

  const dto = query.data;
  if (!dto) {
    return <LoadingState locale={locale} />;
  }

  if (!isInvitationActive(dto)) {
    return <InactiveInvitation token={token} locale={locale} />;
  }

  let data: PublicInvitationData;
  try {
    data = mapPublicInvitationDtoToData(dto, locale);
  } catch (err) {
    return <ErrorState message={(err as Error).message} locale={locale} />;
  }

  return (
    <main>
      {rsvpSubmitted ? (
        <RsvpThankYou data={data} />
      ) : (
        <PublicInvitationPage
          data={data}
          token={token}
          onRsvpClick={() => setRsvpSubmitted(true)}
        />
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Shared status screens
// ---------------------------------------------------------------------------

function LoadingState({ locale }: { locale: 'en' | 'es' }): ReactElement {
  return (
    <main
      lang={locale}
      className="flex min-h-screen items-center justify-center"
      data-testid="invitation-loading"
    >
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-outline-variant)] border-t-[var(--color-primary)]" />
    </main>
  );
}

function UnknownInvitation({
  token,
  locale,
}: {
  token: string;
  locale: 'en' | 'es';
}): ReactElement {
  const t = (es: string, en: string) => (locale === 'es' ? es : en);
  return (
    <main lang={locale} className="mx-auto max-w-xl p-8 text-center" data-testid="invitation-not-found">
      <h1 className="font-display text-3xl">{t('Invitación no encontrada', 'Invitation not found')}</h1>
      <p className="mt-3 text-sm text-[var(--color-secondary)]">
        {t('El enlace ', 'The link ')}
        <code className="rounded bg-[var(--color-surface-container-low)] px-1 py-0.5 font-mono">
          /i/{token}
        </code>
        {t(' no está activo o ya no existe.', ' is not active or no longer exists.')}
      </p>
      <p className="mt-3 text-xs text-[var(--color-secondary)]">
        {t('¿Organizador? Visita ', 'Organizer? Visit ')}
        <a className="underline" href="/login">
          {t('tu panel', 'your dashboard')}
        </a>
        {t(' para revisar la configuración.', ' to review the configuration.')}
      </p>
    </main>
  );
}

function InactiveInvitation({
  token,
  locale,
}: {
  token: string;
  locale: 'en' | 'es';
}): ReactElement {
  const t = (es: string, en: string) => (locale === 'es' ? es : en);
  return (
    <main lang={locale} className="mx-auto max-w-xl p-8 text-center" data-testid="invitation-inactive">
      <h1 className="font-display text-3xl">{t('Próximamente', 'Coming soon')}</h1>
      <p className="mt-3 text-sm text-[var(--color-secondary)]">
        {t(
          'Esta invitación aún no está publicada.',
          'This invitation has not been published yet.',
        )}
      </p>
      <p className="mt-3 text-xs text-[var(--color-secondary)]">
        <code className="rounded bg-[var(--color-surface-container-low)] px-1 py-0.5 font-mono">
          /i/{token}
        </code>
      </p>
    </main>
  );
}

function ErrorState({
  message,
  traceId,
  locale,
}: {
  message: string;
  traceId?: string;
  locale: 'en' | 'es';
}): ReactElement {
  const t = (es: string, en: string) => (locale === 'es' ? es : en);
  return (
    <main lang={locale} className="mx-auto max-w-xl p-8 text-center" data-testid="invitation-error">
      <h1 className="font-display text-3xl">{t('Algo salió mal', 'Something went wrong')}</h1>
      <p className="mt-3 text-sm text-[var(--color-secondary)]">{message}</p>
      {traceId && (
        <p className="mt-3 text-xs text-[var(--color-secondary)]">
          {t('Código de referencia', 'Reference code')}:{' '}
          <code className="font-mono">{traceId}</code>
        </p>
      )}
    </main>
  );
}

function RsvpThankYou({ data }: { data: PublicInvitationData }): ReactElement {
  return (
    <main
      lang={data.locale}
      className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-8 text-center"
      data-testid="invitation-thank-you"
    >
      <h1 className="font-display text-3xl">
        {data.locale === 'es' ? '¡Gracias!' : 'Thank you!'}
      </h1>
      <p className="text-base text-[var(--color-secondary)]">
        {data.locale === 'es'
          ? 'Tu confirmación ha sido registrada.'
          : 'Your RSVP has been recorded.'}
      </p>
      <p className="text-xs text-[var(--color-secondary)]">
        {data.locale === 'es'
          ? 'Si necesitas cambiar tu respuesta, contacta al organizador.'
          : 'If you need to change your response, contact the organizer.'}
      </p>
    </main>
  );
}

// Re-export so tests can assert against the typed error.
export { ApiError };
