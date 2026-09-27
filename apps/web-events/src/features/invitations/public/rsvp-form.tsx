import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, HelpCircle, X } from 'lucide-react';
import { useMemo, useState, type ReactElement } from 'react';

import {
  useApiClient,
  type PublicGroupRsvpRequest,
  type PublicGroupViewDto,
  type PublicInvitationDto,
  type PublicRsvpStatus,
} from '@/shared/api';

/**
 * Shared loader: fetches BOTH the landing page (template + event data)
 * AND the per-group view (group + guests) in parallel. Returns the
 * combined state used by both `/i/:token` and `/i/:token/g/:groupToken`
 * routes.
 */
export function usePublicInvitation(slug: string, groupToken?: string) {
  const api = useApiClient();

  const landing = useQuery<PublicInvitationDto>({
    queryKey: ['public-invitation', 'landing', slug],
    queryFn: () => api.get<PublicInvitationDto>(`/public/invitations/${encodeURIComponent(slug)}`),
    enabled: Boolean(slug),
    staleTime: 30_000,
  });

  const group = useQuery<PublicGroupViewDto>({
    queryKey: ['public-invitation', 'group', slug, groupToken ?? ''],
    queryFn: () =>
      api.get<PublicGroupViewDto>(
        `/public/invitations/${encodeURIComponent(slug)}/groups/${encodeURIComponent(groupToken ?? '')}`,
      ),
    enabled: Boolean(slug && groupToken),
    staleTime: 15_000,
  });

  return { landing, group, api };
}

/**
 * Mutation used by the RSVP form. Returns the updated group view on
 * success so the UI can render the new statuses without a refetch.
 */
export function useSubmitGroupRsvp(slug: string, groupToken: string) {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PublicGroupRsvpRequest) =>
      api.put<PublicGroupViewDto, PublicGroupRsvpRequest>(
        `/public/invitations/${encodeURIComponent(slug)}/groups/${encodeURIComponent(groupToken)}/rsvp`,
        body,
      ),
    onSuccess: (data) => {
      qc.setQueryData(['public-invitation', 'group', slug, groupToken], data);
    },
  });
}

/**
 * Per-group RSVP form. Receives the `PublicGroupViewDto` from the BE,
 * shows one row per guest with three states (pending/confirmed/declined),
 * an optional message field, and a submit button. The submit button is
 * disabled until the user makes at least one change.
 */
export function RsvpForm({
  slug,
  groupToken,
  data,
  locale,
}: {
  slug: string;
  groupToken: string;
  data: PublicGroupViewDto;
  locale: 'en' | 'es';
}): ReactElement {
  const submit = useSubmitGroupRsvp(slug, groupToken);
  const t = (es: string, en: string) => (locale === 'es' ? es : en);

  const initialStatuses = useMemo<Record<string, PublicRsvpStatus>>(() => {
    const m: Record<string, PublicRsvpStatus> = {};
    for (const g of data.guests) m[g.id] = g.rsvpStatus;
    return m;
  }, [data.guests]);

  const [statuses, setStatuses] = useState<Record<string, PublicRsvpStatus>>(initialStatuses);
  const [message, setMessage] = useState<string>('');

  const dirty = useMemo(() => {
    if (message.trim().length > 0) return true;
    return data.guests.some((g) => statuses[g.id] !== initialStatuses[g.id]);
  }, [data.guests, statuses, initialStatuses, message]);

  function setStatus(guestId: string, status: PublicRsvpStatus): void {
    setStatuses((prev) => ({ ...prev, [guestId]: status }));
  }

  function handleSubmit(): void {
    const guests = data.guests
      .filter((g) => statuses[g.id] !== initialStatuses[g.id])
      .map((g) => ({ guestId: g.id, status: statuses[g.id] ?? 'pending' }));
    if (guests.length === 0 && !message.trim()) return;
    submit.mutate({
      message: message.trim() || undefined,
      guests,
    });
  }

  if (submit.isSuccess) {
    return <RsvpSuccess locale={locale} />;
  }

  return (
    <section
      aria-label={t('Confirma tu asistencia', 'Confirm your attendance')}
      className="mx-auto w-full max-w-2xl space-y-6 px-6 py-12"
      data-testid="rsvp-form"
    >
      <header className="space-y-2 text-center">
        <h2 className="font-display text-3xl">
          {t('Confirma tu asistencia', 'Confirm your attendance')}
        </h2>
        <p className="text-sm text-[var(--color-secondary)]">
          {t('Grupo', 'Group')}: <strong>{data.group.name}</strong>
          {' · '}
          {data.guests.length}{' '}
          {data.guests.length === 1 ? t('invitado', 'guest') : t('invitados', 'guests')}
        </p>
      </header>

      <ul className="space-y-3" role="list">
        {data.guests.map((g) => (
          <li
            key={g.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--color-outline-variant)] bg-white p-3"
          >
            <div className="text-sm font-medium">
              {g.fullName}
            </div>
            <div className="flex gap-2" role="radiogroup" aria-label={g.fullName}>
              <RsvpOption
                active={statuses[g.id] === 'confirmed'}
                label={t('Asistirá', 'Will attend')}
                icon={<Check className="h-4 w-4" />}
                tone="confirm"
                onClick={() => setStatus(g.id, 'confirmed')}
              />
              <RsvpOption
                active={statuses[g.id] === 'pending'}
                label={t('Pendiente', 'Pending')}
                icon={<HelpCircle className="h-4 w-4" />}
                tone="neutral"
                onClick={() => setStatus(g.id, 'pending')}
              />
              <RsvpOption
                active={statuses[g.id] === 'declined'}
                label={t('No asistirá', "Can't attend")}
                icon={<X className="h-4 w-4" />}
                tone="decline"
                onClick={() => setStatus(g.id, 'declined')}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <label
          htmlFor="rsvp-message"
          className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-secondary)]"
        >
          {t('Mensaje para el organizador (opcional)', 'Message to the organizer (optional)')}
        </label>
        <textarea
          id="rsvp-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full rounded-md border border-[var(--color-outline-variant)] bg-white p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
          placeholder={
            locale === 'es'
              ? 'Restricciones alimentarias, mensaje, etc.'
              : 'Dietary needs, a note, etc.'
          }
        />
        <p className="text-xs text-[var(--color-secondary)]">
          {message.length}/500
        </p>
      </div>

      {submit.isError && (
        <p
          role="alert"
          className="rounded-md border border-[var(--color-destructive)] bg-[var(--color-error-container)] p-3 text-sm text-[var(--color-on-error-container)]"
        >
          {t(
            'No pudimos registrar tu confirmación. Por favor intenta de nuevo.',
            "We couldn't submit your response. Please try again.",
          )}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          disabled={!dirty || submit.isPending}
          onClick={handleSubmit}
          className="rounded-md bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-[var(--color-on-primary)] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="rsvp-submit"
        >
          {submit.isPending
            ? t('Enviando…', 'Sending…')
            : t('Enviar confirmación', 'Send confirmation')}
        </button>
      </div>
    </section>
  );
}

function RsvpOption({
  active,
  label,
  icon,
  tone,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  tone: 'confirm' | 'neutral' | 'decline';
  onClick: () => void;
}): ReactElement {
  const activeBg =
    tone === 'confirm'
      ? 'bg-[var(--color-status-confirmed-bg)] text-[var(--color-status-confirmed-text)] border-[var(--color-status-confirmed-text)]'
      : tone === 'decline'
        ? 'bg-[var(--color-status-declined-bg)] text-[var(--color-status-declined-text)] border-[var(--color-status-declined-text)]'
        : 'bg-[var(--color-status-pending-bg)] text-[var(--color-status-pending-text)] border-[var(--color-status-pending-text)]';
  const idleBg = 'bg-white text-[var(--color-secondary)] border-[var(--color-outline-variant)]';

  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
        active ? activeBg : idleBg
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function RsvpSuccess({ locale }: { locale: 'en' | 'es' }): ReactElement {
  const t = (es: string, en: string) => (locale === 'es' ? es : en);
  return (
    <section
      aria-live="polite"
      className="mx-auto flex min-h-[40vh] max-w-xl flex-col items-center justify-center gap-3 p-8 text-center"
      data-testid="rsvp-success"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-status-confirmed-bg)] text-[var(--color-status-confirmed-text)]">
        <Check className="h-6 w-6" />
      </div>
      <h2 className="font-display text-3xl">{t('¡Gracias!', 'Thank you!')}</h2>
      <p className="text-sm text-[var(--color-secondary)]">
        {t(
          'Tu confirmación ha sido registrada. Si necesitas cambiar algo, contacta al organizador.',
          'Your response has been recorded. If you need to change something, contact the organizer.',
        )}
      </p>
    </section>
  );
}
