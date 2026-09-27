import { useParams } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { Check, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useApiClient, type EventDto, type EventInvitationConfig, type InvitationTemplate, type UpdateInvitationConfigRequest } from '@/shared/api';
import { Card, CardContent, CardHeader, CardTitle, ErrorBanner, Spinner } from '@/shared/ui';

/**
 * Invitation configuration screen. Three responsibilities:
 *   1. Pick a template from the event-type catalogue.
 *   2. Define a public slug (kebab-case).
 *   3. Toggle the invitation active / RSVP enabled, set deadlines.
 *
 * The BE exposes one canonical PUT under `/invitation-config` so a
 * single submit persists every field. We use React Query mutations
 * for the save (defined inside the child components) and keep the
 * read here.
 */
export function InvitationScreen(): React.ReactElement {
  const params = useParams({ strict: false }) as { eventId?: string };
  const eventId = params.eventId ?? '';
  const api = useApiClient();
  const { t } = useTranslation(['invitations', 'common']);

  const event = useQuery({
    queryKey: ['events', 'detail', eventId],
    queryFn: () => api.get<EventDto>(`/events/${eventId}`),
    enabled: Boolean(eventId),
  });

  const config = useQuery({
    queryKey: ['invitation', 'config', eventId],
    queryFn: () => api.get<EventInvitationConfig>(`/events/${eventId}/invitation-config`),
    enabled: Boolean(eventId),
  });

  const templates = useQuery({
    queryKey: ['invitation', 'templates', event.data?.eventType],
    queryFn: () => {
      const params = new URLSearchParams({
        eventType: event.data?.eventType ?? 'wedding',
        onlyActive: 'true',
      });
      return api
        .get<{ items: InvitationTemplate[] }>(
          `/invitation-templates?${params.toString()}`,
        )
        .then((r) => r.items ?? []);
    },
    enabled: Boolean(event.data?.eventType),
  });

  const qc = useQueryClient();
  const updateConfig = useMutation<
    EventInvitationConfig,
    Error,
    UpdateInvitationConfigRequest
  >({
    mutationFn: (patch) => {
      const base = config.data;
      if (!base) {
        return Promise.reject(new Error('Invitation config not loaded yet'));
      }
      return api.put<EventInvitationConfig>(
        `/events/${eventId}/invitation-config`,
        { ...base, ...patch },
      );
    },
    onSuccess: (next) => {
      qc.setQueryData(['invitation', 'config', eventId], next);
      // The events list AND the dashboard home preview each keep their own cache of event
      // summaries (different query keys) and both derive their card gradient from
      // templateCode, so a template change must invalidate both.
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'events'] });
    },
    onError: () => qc.invalidateQueries({ queryKey: ['invitation', 'config', eventId] }),
  });

  const activeTemplate = useMemo(() => {
    if (!config.data?.templateId) return null;
    return templates.data?.find((t) => t.id === config.data?.templateId) ?? null;
  }, [config.data, templates.data]);

  if (event.isLoading || config.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!event.data) return <></>;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-8 py-8" data-testid="invitation-screen">
      <header>
        <h1
          className="text-3xl font-bold tracking-tight text-[var(--color-on-surface)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('invitations:title')}
        </h1>
        <p className="mt-1 max-w-xl text-sm text-[var(--color-secondary)]">
          {t('invitations:subtitle')}
        </p>
      </header>

      {updateConfig.isError ? (
        <ErrorBanner>{updateConfig.error?.message ?? t('common:errors.generic')}</ErrorBanner>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('invitations:templates.title')}</CardTitle>
          <p className="text-xs text-[var(--color-secondary)]">
            {t('invitations:templates.subtitle')}
          </p>
        </CardHeader>
        <CardContent>
          {templates.isLoading ? (
            <Spinner />
          ) : !templates.data || templates.data.length === 0 ? (
            <div className="rounded-md border border-dashed border-[var(--color-outline-variant)] p-6 text-center text-sm text-[var(--color-secondary)]">
              {t('invitations:templates.empty')}
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {templates.data.map((tpl) => {
                const active = config.data?.templateId === tpl.id;
                const pending = updateConfig.isPending && updateConfig.variables?.templateId === tpl.id;
                return (
                  <li key={tpl.id}>
                    <button
                      type="button"
                      onClick={() => updateConfig.mutate({ templateId: tpl.id })}
                      disabled={updateConfig.isPending}
                      aria-pressed={active}
                      className={
                        'group relative w-full rounded-lg border p-4 text-left transition-all ' +
                        (active
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary-fixed)]/30 ring-1 ring-[var(--color-primary)]'
                          : 'border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)]') +
                        (updateConfig.isPending ? ' cursor-wait' : '')
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-semibold text-[var(--color-on-surface)]">
                          {tpl.name}
                        </div>
                        {active ? (
                          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)]">
                            <Check className="h-3 w-3" />
                          </span>
                        ) : null}
                        {pending ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--color-secondary)]" />
                        ) : null}
                      </div>
                      {tpl.description && (
                        <p className="mt-1 text-xs text-[var(--color-secondary)]">
                          {tpl.description}
                        </p>
                      )}
                      <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-secondary)]">
                        {tpl.code}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <InvitationSettingsPanel
        config={config.data}
        activeTemplate={activeTemplate}
        updateConfig={updateConfig}
      />
    </div>
  );
}

function InvitationSettingsPanel({
  config,
  activeTemplate,
  updateConfig,
}: {
  config: EventInvitationConfig | undefined;
  activeTemplate: InvitationTemplate | null;
  updateConfig: UseMutationResult<EventInvitationConfig, Error, UpdateInvitationConfigRequest>;
}) {
  const { t } = useTranslation(['invitations', 'common']);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('invitations:settings.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <section className="rounded-md border border-[var(--color-outline-variant)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-on-surface)]">
                {config?.active ? t('invitations:settings.active') : t('invitations:settings.inactive')}
              </h3>
              <p className="mt-1 text-xs text-[var(--color-secondary)]">
                {config?.active ? t('invitations:settings.activeDescription') : t('invitations:settings.inactiveDescription')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateConfig.mutate({ active: !config?.active })}
              disabled={updateConfig.isPending}
              className={
                'inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:cursor-wait ' +
                (config?.active ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-outline-variant)]')
              }
              aria-pressed={Boolean(config?.active)}
            >
              <span
                className={
                  'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ' +
                  (config?.active ? 'translate-x-6' : 'translate-x-1')
                }
              />
            </button>
          </div>
        </section>

        <section className="rounded-md border border-[var(--color-outline-variant)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-on-surface)]">
                {t('invitations:settings.rsvpEnabled')}
              </h3>
              <p className="mt-1 text-xs text-[var(--color-secondary)]">
                {t('invitations:settings.rsvpEnabledDescription')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateConfig.mutate({ rsvpEnabled: !config?.rsvpEnabled })}
              disabled={updateConfig.isPending}
              className={
                'inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:cursor-wait ' +
                (config?.rsvpEnabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-outline-variant)]')
              }
              aria-pressed={Boolean(config?.rsvpEnabled)}
            >
              <span
                className={
                  'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ' +
                  (config?.rsvpEnabled ? 'translate-x-6' : 'translate-x-1')
                }
              />
            </button>
          </div>
        </section>

        {config?.slug && (
          <section className="rounded-md bg-[var(--color-surface-container-low)] p-4 text-xs">
            <p className="font-semibold uppercase tracking-wider text-[var(--color-secondary)]">
              {t('invitations:publicLink.title')}
            </p>
            <p className="mt-1 text-[var(--color-secondary)]">
              {t('invitations:publicLink.description')}
            </p>
            <code className="mt-2 block break-all rounded border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-2 font-mono">
              {typeof window !== 'undefined' ? window.location.origin : ''}/i/{config.slug}
            </code>
            <p className="mt-2 text-[var(--color-secondary)]">
              {t('invitations:publicLink.preview')}{' '}
              <span className="font-mono">
                /i/{config.slug}{activeTemplate ? ` + template "${activeTemplate.name}"` : ''}
              </span>
            </p>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
