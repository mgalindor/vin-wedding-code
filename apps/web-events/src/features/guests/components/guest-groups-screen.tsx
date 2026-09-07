import { Link, useParams } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Link2, RefreshCw, Trash2, Users2, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useGuestsService } from '@/features/guests/guests.service';
import { useApiClient, type CreateGuestGroupRequest, type EventInvitationConfig, type GuestGroup } from '@/shared/api';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  FieldShell,
  Input,
  Spinner,
} from '@/shared/ui';

export function GuestGroupsScreen(): React.ReactElement {
  const params = useParams({ strict: false }) as { eventId?: string };
  const eventId = params.eventId ?? '';
  const service = useGuestsService();
  const qc = useQueryClient();
  const { t } = useTranslation(['guests', 'common']);
  const [showCreate, setShowCreate] = useState(false);

  // Server returns either `{ items: [...] }` (for the list endpoint) or
  // the array directly — normalise both shapes.
  const groups = useQuery({
    queryKey: ['guests', 'groups', eventId],
    queryFn: () => service.listGroups(eventId).then((r) => r.items ?? []),
    enabled: Boolean(eventId),
  });

  const guestCounts = useQuery({
    queryKey: ['guests', 'counts', eventId],
    // Best-effort: walk the first page of all guests to bucket them.
    queryFn: () =>
      service.listGuests(eventId, { size: 200 }).then((p) => {
        const m: Record<string, number> = {};
        for (const g of p.items) m[g.groupId] = (m[g.groupId] ?? 0) + 1;
        return m;
      }),
    enabled: Boolean(eventId),
  });

  const api = useApiClient();
  const invitationConfig = useQuery({
    queryKey: ['events', 'invitation-config', eventId],
    queryFn: () => api.get<EventInvitationConfig>(`/events/${eventId}/invitation-config`),
    enabled: Boolean(eventId),
  });
  const slug = invitationConfig.data?.slug ?? null;

  const create = useMutation({
    mutationFn: (dto: CreateGuestGroupRequest) => service.createGroup(eventId, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['guests', 'groups', eventId] });
      setShowCreate(false);
    },
  });

  const regenerate = useMutation({
    mutationFn: (groupId: string) => service.regenerateGroupToken(eventId, groupId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['guests', 'groups', eventId] }),
  });

  const remove = useMutation({
    mutationFn: (groupId: string) => service.deleteGroup(eventId, groupId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['guests', 'groups', eventId] }),
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-8 py-8" data-testid="guest-groups">
      <header>
        <h1
          className="text-3xl font-bold tracking-tight text-[var(--color-on-surface)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('guests:groups.title')}
        </h1>
        <p className="mt-1 max-w-xl text-sm text-[var(--color-secondary)]">
          {t('guests:groups.subtitle')}
        </p>
      </header>

      <div className="flex items-center justify-end">
        <Button
          onClick={() => setShowCreate((v) => !v)}
          variant={showCreate ? 'outline' : 'default'}
        >
          <UsersRound className="h-4 w-4" />{' '}
          {showCreate ? t('common:actions.cancel') : t('guests:groups.addGroup')}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>{t('guests:groups.addGroup')}</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateGroupForm
              submitting={create.isPending}
              error={create.error instanceof Error ? create.error.message : null}
              onCancel={() => setShowCreate(false)}
              onSubmit={(dto) => create.mutate(dto)}
            />
          </CardContent>
        </Card>
      )}

      {groups.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !groups.data || groups.data.length === 0 ? (
        <EmptyState
          icon={<UsersRound className="h-6 w-6" />}
          title={t('guests:groups.empty')}
          action={
            <Button onClick={() => setShowCreate(true)}>
              {t('guests:groups.addGroup')}
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {groups.data.map((g) => (
            <li key={g.id}>
              <GroupCard
                group={g}
                guestCount={guestCounts.data?.[g.id] ?? 0}
                slug={slug}
                onCopyLink={async () => {
                  const origin = typeof window !== 'undefined' ? window.location.origin : '';
                  const url = slug
                    ? `${origin}/i/${slug}/g/${g.invitationToken}`
                    : `${origin}/i/${g.invitationToken}`;
                  await navigator.clipboard.writeText(url);
                }}
                onRegenerate={() => regenerate.mutate(g.id)}
                onDelete={() => {
                  if (window.confirm(t('guests:groups.regenerateConfirm'))) {
                    remove.mutate(g.id);
                  }
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CreateGroupForm({
  onSubmit,
  onCancel,
  submitting,
  error,
}: {
  onSubmit: (dto: CreateGuestGroupRequest) => void;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const { t } = useTranslation(['guests', 'common']);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateGuestGroupRequest>({
    defaultValues: { name: '', relationship: '', sharedEmail: '', sharedPhone: '' },
  });

  const onSubmitValid = (state: CreateGuestGroupRequest) => {
    onSubmit({
      name: state.name.trim(),
      relationship: state.relationship || undefined,
      sharedEmail: state.sharedEmail || undefined,
      sharedPhone: state.sharedPhone || undefined,
    });
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmitValid)} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FieldShell label={t('guests:groups.fields.name')} required error={errors.name?.message}>
          <Input
            placeholder={t('guests:groups.fields.namePlaceholder')}
            {...register('name', { required: 'Required' })}
          />
        </FieldShell>
        <FieldShell label={t('guests:groups.fields.relationship')}>
          <Input
            placeholder="Family, Work, Friends…"
            {...register('relationship')}
          />
        </FieldShell>
        <FieldShell label={t('guests:groups.fields.sharedEmail')}>
          <Input type="email" {...register('sharedEmail')} />
        </FieldShell>
        <FieldShell label={t('guests:groups.fields.sharedPhone')}>
          <Input type="tel" {...register('sharedPhone')} />
        </FieldShell>
      </div>
      {error && <div className="rounded border-l-4 border-destructive bg-error-container/30 p-3 text-sm text-destructive">{error}</div>}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common:actions.cancel')}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? t('common:actions.saving') : t('guests:groups.addGroup')}
        </Button>
      </div>
    </form>
  );
}

function GroupCard({
  group,
  guestCount,
  slug,
  onCopyLink,
  onRegenerate,
  onDelete,
}: {
  group: GuestGroup;
  guestCount: number;
  slug: string | null;
  onCopyLink: () => Promise<void>;
  onRegenerate: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation('guests');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopyLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3
              className="text-base font-semibold text-[var(--color-on-surface)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {group.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-secondary)]">
              {group.relationship && <Badge tone="neutral">{group.relationship}</Badge>}
              <span>
                <Users2 className="mr-1 inline h-3 w-3" />
                {guestCount} {guestCount === 1 ? 'guest' : 'guests'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCopy} data-testid="copy-link">
              <Copy className="h-3.5 w-3.5" /> {copied ? t('guests:groups.linkCopied') : t('common:actions.copy')}
            </Button>
            <Button variant="ghost" size="sm" onClick={onRegenerate}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5 text-[var(--color-destructive)]" />
            </Button>
          </div>
        </div>

        {/* Token preview */}
        <div className="flex items-center justify-between rounded-md bg-[var(--color-surface-container-low)] px-3 py-2 text-xs">
          <code className="truncate font-mono text-[var(--color-secondary)]">
            {slug
              ? `/i/${slug}/g/${group.invitationToken}`
              : `/i/${group.invitationToken}`}
          </code>
          <Link
            {...(slug
              ? {
                  to: '/i/$token/g/$groupToken',
                  params: { token: slug, groupToken: group.invitationToken },
                }
              : { to: '/i/$token', params: { token: group.invitationToken } })}
            target="_blank"
            className="ml-2 inline-flex items-center gap-1 text-[var(--color-primary)] no-underline hover:underline"
          >
            <Link2 className="h-3 w-3" /> {t('common:actions.open')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export { CardTitle, CardHeader };
