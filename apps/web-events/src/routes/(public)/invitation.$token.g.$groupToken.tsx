import { useParams } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { isApiError } from '@/shared/api';

import {
  PublicInvitationPage,
  resolvePublicLocale,
  isInvitationActive,
  mapPublicInvitationDtoToData,
} from '@/features/invitations/public';
import { RsvpForm, usePublicInvitation } from '@/features/invitations/public/rsvp-form';
import type { PublicInvitationData } from '@/features/invitations/public/types';

/**
 * Per-group public invitation route.
 *
 * URL contract: `/i/{slug}/g/{groupToken}`
 *
 * - The landing data (`GET /public/invitations/{slug}`) provides the
 *   chosen template + the event payload.
 * - The group data (`GET /public/invitations/{slug}/groups/{groupToken}`)
 *   provides the list of guests the primary contact can mark.
 * - Submitting the form `PUT .../groups/{groupToken}/rsvp` triggers the
 *   success state inside the form.
 *
 * Same status screens as `/i/:token` for loading / error / inactive /
 * not-found cases.
 */
export function PublicGroupRsvpScreen(): ReactElement {
  const params = useParams({ strict: false }) as { token?: string; groupToken?: string };
  const slug = params.token ?? '';
  const groupToken = params.groupToken ?? '';

  const { i18n } = useTranslation();
  const locale = resolvePublicLocale(
    undefined,
    i18n.language,
    typeof navigator !== 'undefined' ? navigator.language : undefined,
  );

  const { landing, group } = usePublicInvitation(slug, groupToken);

  // ----- Loading -----
  if (landing.isLoading || group.isLoading) {
    return <LoadingState locale={locale} />;
  }

  // ----- Not found / inactive / error -----
  if (landing.isError) {
    if (isApiError(landing.error) && (landing.error.status === 404 || landing.error.status === 410)) {
      return <UnknownInvitation slug={slug} locale={locale} />;
    }
    if (isApiError(landing.error) && landing.error.code === 'invitation_inactive') {
      return <InactiveInvitation slug={slug} locale={locale} />;
    }
    return (
      <ErrorState
        message={
          landing.error instanceof Error
            ? landing.error.message
            : 'Unexpected error'
        }
        traceId={isApiError(landing.error) ? landing.error.traceId : undefined}
        locale={locale}
      />
    );
  }

  const landingData = landing.data;
  if (!landingData || !isInvitationActive(landingData)) {
    return <InactiveInvitation slug={slug} locale={locale} />;
  }

  if (group.isError) {
    if (isApiError(group.error) && (group.error.status === 404 || group.error.status === 410)) {
      return <UnknownGroup slug={slug} groupToken={groupToken} locale={locale} />;
    }
    return (
      <ErrorState
        message={group.error instanceof Error ? group.error.message : 'Unexpected error'}
        traceId={isApiError(group.error) ? group.error.traceId : undefined}
        locale={locale}
      />
    );
  }

  const groupData = group.data;
  if (!groupData) {
    return <LoadingState locale={locale} />;
  }

  // ----- Map landing → template + render template, then render form -----
  let data: PublicInvitationData;
  try {
    data = mapPublicInvitationDtoToData(landingData, locale);
  } catch (err) {
    return (
      <ErrorState
        message={(err as Error).message}
        locale={locale}
      />
    );
  }

  const rsvpEnabled = landingData.rsvpEnabled;

  return (
    <main>
      <PublicInvitationPage
        data={data}
        token={slug}
        rsvpEnabled={rsvpEnabled}
      />
      {rsvpEnabled ? (
        <RsvpForm slug={slug} groupToken={groupToken} data={groupData} locale={locale} />
      ) : (
        <RsvpClosed locale={locale} />
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Status screens (shared with the landing page route)
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

function UnknownInvitation({ slug, locale }: { slug: string; locale: 'en' | 'es' }): ReactElement {
  const t = (es: string, en: string) => (locale === 'es' ? es : en);
  return (
    <main lang={locale} className="mx-auto max-w-xl p-8 text-center" data-testid="invitation-not-found">
      <h1 className="font-display text-3xl">{t('Invitación no encontrada', 'Invitation not found')}</h1>
      <p className="mt-3 text-sm text-[var(--color-secondary)]">
        {t('El enlace ', 'The link ')}
        <code className="rounded bg-[var(--color-surface-container-low)] px-1 py-0.5 font-mono">
          /i/{slug}
        </code>
        {t(' no está activo o ya no existe.', ' is not active or no longer exists.')}
      </p>
    </main>
  );
}

function UnknownGroup({
  slug,
  groupToken,
  locale,
}: {
  slug: string;
  groupToken: string;
  locale: 'en' | 'es';
}): ReactElement {
  const t = (es: string, en: string) => (locale === 'es' ? es : en);
  return (
    <main lang={locale} className="mx-auto max-w-xl p-8 text-center" data-testid="invitation-group-not-found">
      <h1 className="font-display text-3xl">{t('Grupo no encontrado', 'Group not found')}</h1>
      <p className="mt-3 text-sm text-[var(--color-secondary)]">
        {t('Este grupo no pertenece a esta invitación o el enlace ya no es válido.', 'This group is not part of this invitation, or the link is no longer valid.')}
      </p>
      <p className="mt-3 text-xs text-[var(--color-secondary)]">
        <code className="font-mono">/i/{slug}/g/{groupToken}</code>
      </p>
    </main>
  );
}

function InactiveInvitation({ slug, locale }: { slug: string; locale: 'en' | 'es' }): ReactElement {
  const t = (es: string, en: string) => (locale === 'es' ? es : en);
  return (
    <main lang={locale} className="mx-auto max-w-xl p-8 text-center" data-testid="invitation-inactive">
      <h1 className="font-display text-3xl">{t('Próximamente', 'Coming soon')}</h1>
      <p className="mt-3 text-sm text-[var(--color-secondary)]">
        {t('Esta invitación aún no está publicada.', 'This invitation has not been published yet.')}
      </p>
      <p className="mt-3 text-xs text-[var(--color-secondary)]">
        <code className="rounded bg-[var(--color-surface-container-low)] px-1 py-0.5 font-mono">
          /i/{slug}
        </code>
      </p>
    </main>
  );
}

function RsvpClosed({ locale }: { locale: 'en' | 'es' }): ReactElement {
  const t = (es: string, en: string) => (locale === 'es' ? es : en);
  return (
    <section
      className="mx-auto w-full max-w-2xl px-6 py-12 text-center"
      data-testid="rsvp-closed"
    >
      <h2 className="font-display text-3xl">{t('Las confirmaciones están cerradas', 'RSVPs are closed')}</h2>
      <p className="mt-2 text-sm text-[var(--color-secondary)]">
        {t(
          'El organizador ha desactivado las confirmaciones para esta invitación.',
          'The organizer has disabled RSVPs for this invitation.',
        )}
      </p>
    </section>
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
      <p className="mt-6">
        <Link to="/preview/templates" className="text-xs text-[var(--color-secondary)] underline">
          {t('Ver galería de templates', 'Browse the template gallery')}
        </Link>
      </p>
    </main>
  );
}
