import { Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Archive, ChevronRight, ExternalLink, Image as ImageIcon, Trash2, Users2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  useEventsService,
  type EventDto,
} from '@/features/events/events.service';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';

export function EventOverviewScreen(): React.ReactElement {
  const params = useParams({ strict: false }) as { eventId?: string };
  const eventId = params.eventId ?? '';
  const service = useEventsService();
  const { t } = useTranslation(['events', 'common']);

  const event = useQuery({
    queryKey: ['events', 'detail', eventId],
    queryFn: () => service.getEvent(eventId),
    enabled: Boolean(eventId),
  });

  if (!event.data) return <></>;

  return <Overview event={event.data} />;
}

function Overview({ event }: { event: EventDto }) {
  const { t } = useTranslation(['events', 'common']);
  const service = useEventsService();

  const locationsCount = event.locations?.items.length ?? 0;
  const programCount = event.program?.items.length ?? 0;

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-8 py-8 lg:grid-cols-3">
      {/* Left: next steps */}
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t('events:detail.overview.next')}</CardTitle>
              <p className="text-xs text-[var(--color-secondary)]">
                {t('events:statuses.title')}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <NextStepRow
              number={1}
              title={t('events:detail.weddings.title')}
              description={t('events:detail.weddings.subtitle')}
              to="/dashboard/events/$eventId/wedding"
              eventId={event.id}
            />
            <NextStepRow
              number={2}
              title={t('events:detail.tabs.guests')}
              description={t('events:title')}
              to="/dashboard/events/$eventId/guests"
              eventId={event.id}
            />
            <NextStepRow
              number={3}
              title={t('events:detail.tabs.invitation')}
              description={
                event.status === 'published'
                  ? t('events:detail.overview.invitationInactive')
                  : t('events:detail.overview.invitationInactive')
              }
              to="/dashboard/events/$eventId/invitation"
              eventId={event.id}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t('events:detail.overview.data')}</CardTitle>
              <p className="text-xs text-[var(--color-secondary)]">
                {t('events:subtitle')}
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {locationsCount > 0 ? (
              <DataSummary
                label={t('events:detail.locations.title')}
                value={`${locationsCount}`}
                icon={ImageIcon}
              />
            ) : null}
            {programCount > 0 ? (
              <DataSummary
                label={t('events:detail.program.title')}
                value={`${programCount}`}
                icon={ImageIcon}
              />
            ) : null}
            {event.contacts?.primaryContactName ? (
              <DataSummary
                label={t('events:detail.contacts.title')}
                value={event.contacts.primaryContactName}
                icon={ImageIcon}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Right: stats + actions */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('events:detail.overview.stats.guests')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              to="/dashboard/events/$eventId/guests"
              params={{ eventId: event.id }}
              className="flex items-center justify-between rounded-md border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-4 no-underline transition-colors hover:bg-[var(--color-surface-container-high)]"
            >
              <div className="flex items-center gap-3">
                <Users2 className="h-5 w-5 text-[var(--color-primary)]" />
                <div>
                  <div className="text-2xl font-bold text-[var(--color-on-surface)]">—</div>
                  <div className="text-xs text-[var(--color-secondary)]">
                    {t('events:detail.overview.openInvitation')}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--color-secondary)]" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('events:detail.overview.actions.editBasics')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              to="/dashboard/events/$eventId/edit"
              params={{ eventId: event.id }}
              className="block"
            >
              <Button variant="outline" className="w-full justify-start">
                <ExternalLink className="h-4 w-4" /> {t('events:detail.overview.actions.editBasics')}
              </Button>
            </Link>
            <ArchiveButton eventId={event.id} />
            <DangerButton eventId={event.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NextStepRow({
  number,
  title,
  description,
  to,
  eventId,
}: {
  number: number;
  title: string;
  description: string;
  to: string;
  eventId: string;
}) {
  return (
    <Link
      to={to as never}
      params={{ eventId }}
      className="flex items-start gap-3 rounded-md border border-transparent p-3 transition-colors hover:border-[var(--color-primary-container)] hover:bg-[var(--color-surface-container-low)]"
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-fixed-dim)] text-xs font-bold text-[var(--color-on-primary-fixed-variant)]"
      >
        {number}
      </span>
      <div className="grow">
        <div className="text-sm font-semibold text-[var(--color-on-surface)]">{title}</div>
        <div className="text-xs text-[var(--color-secondary)]">{description}</div>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 text-[var(--color-secondary)]" />
    </Link>
  );
}

function DataSummary({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-md border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)]">
          {label}
        </span>
        <Icon className="h-4 w-4 opacity-60" />
      </div>
      <div className="mt-1 text-base font-semibold text-[var(--color-on-surface)]">{value}</div>
    </div>
  );
}

function ArchiveButton({ eventId }: { eventId: string }) {
  const { t } = useTranslation('events');
  const service = useEventsService();

  const onArchive = async () => {
    if (window.confirm(t('detail.overview.warnings.archiveConfirm'))) {
      await service.archiveEvent(eventId);
      location.reload();
    }
  };

  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-[var(--color-secondary)]"
      onClick={onArchive}
      data-testid="event-archive"
    >
      <Archive className="h-4 w-4" /> {t('events:detail.overview.actions.archive')}
    </Button>
  );
}

function DangerButton({ eventId }: { eventId: string }) {
  const { t } = useTranslation(['events', 'common']);
  const service = useEventsService();

  const onDelete = async () => {
    if (window.confirm(t('common:actions.deleteConfirm'))) {
      await service.deleteEvent(eventId);
      location.href = '/dashboard';
    }
  };

  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-[var(--color-destructive)]"
      onClick={onDelete}
      data-testid="event-delete"
    >
      <Trash2 className="h-4 w-4" /> {t('events:detail.overview.actions.delete')}
    </Button>
  );
}

/* Reserved for future use — placeholder for a future "hide preview" toggle. */
const _EyeOffPlaceholder: null = null;
void _EyeOffPlaceholder;
