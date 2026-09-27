import { Link, useParams } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Copy, Link2, Plus, RefreshCw, Star, Trash2, Users2, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useGuestsService } from '@/features/guests/guests.service';
import { useApiClient, type CreateGuestGroupRequest, type CreateGuestRequest, type EventInvitationConfig, type GuestGroup } from '@/shared/api';
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
  Select,
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
      void qc.invalidateQueries({ queryKey: ['guests', 'counts', eventId] });
      void qc.invalidateQueries({ queryKey: ['guests', 'list', eventId] });
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
                eventId={eventId}
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

interface CreateGroupFormMember {
  fullName: string;
  primary: boolean;
}

interface CreateGroupFormValues {
  name: string;
  relationship: 'family' | 'friends' | 'other';
  sharedEmail: string;
  sharedPhone: string;
  members: CreateGroupFormMember[];
}

const EMPTY_MEMBER: CreateGroupFormMember = {
  fullName: '',
  primary: false,
};

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
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateGroupFormValues>({
    defaultValues: {
      name: '',
      relationship: 'other',
      sharedEmail: '',
      sharedPhone: '',
      members: [{ ...EMPTY_MEMBER, primary: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'members',
  });

  const members = watch('members');

  /**
   * Mark `idx` as the primary contact and clear the flag on everyone
   * else. The form enforces "exactly one primary" client-side so the
   * BE never sees a payload with 0 or 2 primaries.
   */
  const setPrimary = (idx: number): void => {
    members.forEach((_, i) =>
      setValue(`members.${i}.primary`, i === idx, { shouldDirty: true }),
    );
  };

  const onSubmitValid = (state: CreateGroupFormValues) => {
    const cleanMembers = state.members
      .filter((m) => m.fullName.trim())
      .map((m) => ({
        fullName: m.fullName.trim(),
        rsvpStatus: 'pending' as const,
        primary: m.primary,
      }));

    // If the user unmarked everyone by accident, default to the first
    // surviving member so the BE validation still passes.
    const hasPrimary = cleanMembers.some((m) => m.primary);
    if (!hasPrimary && cleanMembers.length > 0) {
      cleanMembers[0]!.primary = true;
    }

    onSubmit({
      name: state.name.trim(),
      relationship: state.relationship,
      sharedEmail: state.sharedEmail?.trim() || undefined,
      sharedPhone: state.sharedPhone?.trim() || undefined,
      guests: cleanMembers,
    });
    reset({
      name: '',
      relationship: 'other',
      sharedEmail: '',
      sharedPhone: '',
      members: [{ ...EMPTY_MEMBER, primary: true }],
    });
  };

  const primaryCount = members.filter((m) => m.primary).length;
  const hasAnyFilled = members.some((m) => m.fullName.trim());

  return (
    <form onSubmit={handleSubmit(onSubmitValid)} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FieldShell label={t('guests:groups.fields.name')} required error={errors.name?.message}>
          <Input
            placeholder={t('guests:groups.fields.namePlaceholder')}
            {...register('name', { required: 'Required' })}
          />
        </FieldShell>
        <FieldShell
          label={t('guests:groups.fields.relationship')}
          required
          error={errors.relationship?.message}
        >
          <Select
            invalid={Boolean(errors.relationship)}
            {...register('relationship', { required: 'Required' })}
            defaultValue="other"
          >
            <option value="family">{t('guests:groups.relationships.family')}</option>
            <option value="friends">{t('guests:groups.relationships.friends')}</option>
            <option value="other">{t('guests:groups.relationships.other')}</option>
          </Select>
        </FieldShell>
        <FieldShell label={t('guests:groups.fields.sharedEmail')}>
          <Input type="email" {...register('sharedEmail')} />
        </FieldShell>
        <FieldShell label={t('guests:groups.fields.sharedPhone')}>
          <Input type="tel" {...register('sharedPhone')} />
        </FieldShell>
      </div>

      <div className="space-y-2 rounded-md border border-[var(--color-outline-variant)] p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-secondary)]">
            {t('guests:groups.membersHeading')}
          </p>
          <p className="text-xs text-[var(--color-secondary)]">
            {t('guests:groups.fields.primaryHint', { count: primaryCount })}
          </p>
        </div>

        {fields.map((field, i) => {
          const member = members[i];
          const isPrimary = member?.primary ?? false;
          return (
            <div
              key={field.id}
              className="space-y-2 rounded-md border border-[var(--color-outline-variant)] p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-secondary)]">
                  {t('guests:groups.fields.memberLabel', { index: i + 1 })}
                  {isPrimary ? (
                    <span className="ml-2 inline-flex items-center rounded bg-[var(--color-surface-container-high)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-on-surface)]">
                      <Star className="mr-1 inline h-3 w-3" />
                      {t('guests:groups.primaryBadge')}
                    </span>
                  ) : null}
                </span>
                {fields.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(i)}
                    aria-label={t('guests:groups.removeMember')}
                    title={t('guests:groups.removeMember')}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-[var(--color-destructive)]" />
                  </Button>
                ) : null}
              </div>

              <FieldShell
                label={t('guests:guest.fullName')}
                required
                error={errors.members?.[i]?.fullName?.message}
              >
                <Input
                  {...register(`members.${i}.fullName` as const, { required: 'Required' })}
                  placeholder={t('guests:groups.fields.fullNamePlaceholder')}
                />
              </FieldShell>

              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant={isPrimary ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPrimary(i)}
                  disabled={isPrimary}
                  title={t('guests:groups.markPrimary')}
                  aria-label={t('guests:groups.markPrimary')}
                >
                  <Star className="h-3.5 w-3.5" />
                  {isPrimary ? t('guests:groups.primaryBadge') : t('guests:groups.markPrimary')}
                </Button>
              </div>
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ ...EMPTY_MEMBER, primary: false })}
          disabled={fields.length >= 12}
        >
          <Plus className="h-3.5 w-3.5" /> {t('guests:groups.addMember')}
        </Button>

        {hasAnyFilled && primaryCount === 0 ? (
          <p className="text-xs text-[var(--color-destructive)]">
            {t('guests:groups.fields.primaryRequired')}
          </p>
        ) : null}
      </div>

      {error ? (
        <div className="rounded border-l-4 border-destructive bg-error-container/30 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

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
  eventId,
  onCopyLink,
  onRegenerate,
  onDelete,
}: {
  group: GuestGroup;
  guestCount: number;
  slug: string | null;
  eventId: string;
  onCopyLink: () => Promise<void>;
  onRegenerate: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation(['guests', 'common']);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    await onCopyLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex flex-1 items-start gap-2 text-left"
            aria-expanded={expanded}
          >
            <ChevronRight
              className={
                'mt-0.5 h-4 w-4 text-[var(--color-secondary)] transition-transform ' +
                (expanded ? 'rotate-90' : '')
              }
            />
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
                  {guestCount} {guestCount === 1 ? t('guests:groups.member') : t('guests:groups.members')}
                </span>
              </div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCopy} data-testid="copy-link">
              <Copy className="h-3.5 w-3.5" /> {copied ? t('guests:groups.linkCopied') : t('common:actions.copy')}
            </Button>
            <Button variant="ghost" size="sm" onClick={onRegenerate} aria-label={t('guests:groups.regenerateToken')}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} aria-label={t('guests:groups.deleteGroup')}>
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

        {/* Expanded members section */}
        {expanded ? (
          <GroupMembers eventId={eventId} groupId={group.id} primaryGuestId={group.primaryGuestId ?? null} />
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * Member-list section shown when the user expands a group card. Owns
 * its own `guests` query so we don't over-fetch when most groups stay
 * collapsed; invalidates both the local query and the parent's counts
 * query when members are added / removed / re-marked.
 */
function GroupMembers({
  eventId,
  groupId,
  primaryGuestId,
}: {
  eventId: string;
  groupId: string;
  primaryGuestId: string | null;
}) {
  const { t } = useTranslation(['guests', 'common']);
  const service = useGuestsService();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const members = useQuery({
    queryKey: ['guests', 'members', eventId, groupId],
    queryFn: () =>
      service.listGuests(eventId, { groupId, size: 100 }).then((p) => p.items ?? []),
    enabled: Boolean(eventId) && Boolean(groupId),
  });

  const addMember = useMutation({
    mutationFn: (dto: CreateGuestRequest) => service.createGuest(eventId, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['guests', 'members', eventId, groupId] });
      void qc.invalidateQueries({ queryKey: ['guests', 'counts', eventId] });
      void qc.invalidateQueries({ queryKey: ['guests', 'groups', eventId] });
      void qc.invalidateQueries({ queryKey: ['guests', 'list', eventId] });
      setShowAdd(false);
    },
  });

  const removeMember = useMutation({
    mutationFn: (guestId: string) => service.deleteGuest(eventId, guestId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['guests', 'members', eventId, groupId] });
      void qc.invalidateQueries({ queryKey: ['guests', 'counts', eventId] });
      void qc.invalidateQueries({ queryKey: ['guests', 'list', eventId] });
    },
  });

  const setPrimary = useMutation({
    mutationFn: (guestId: string) => service.updatePrimaryGuest(eventId, groupId, guestId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['guests', 'groups', eventId] });
      void qc.invalidateQueries({ queryKey: ['guests', 'members', eventId, groupId] });
    },
  });

  return (
    <div className="space-y-2 border-t border-[var(--color-outline-variant)] pt-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-secondary)]">
          {t('guests:groups.membersHeading')}
        </p>
        {!showAdd ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAdd(true)}
            data-testid={`add-member-${groupId}`}
          >
            <Plus className="h-3.5 w-3.5" /> {t('guests:groups.addMember')}
          </Button>
        ) : null}
      </div>

      {showAdd ? (
        <AddMemberForm
          groupId={groupId}
          submitting={addMember.isPending}
          error={addMember.error instanceof Error ? addMember.error.message : null}
          onCancel={() => setShowAdd(false)}
          onSubmit={(dto) => addMember.mutate(dto)}
        />
      ) : null}

      {members.isLoading ? (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      ) : !members.data || members.data.length === 0 ? (
        <p className="text-xs text-[var(--color-secondary)]">{t('guests:groups.noMembers')}</p>
      ) : (
        <ul className="space-y-1">
          {members.data.map((g) => {
            const isPrimary = g.id === primaryGuestId;
            return (
              <li
                key={g.id}
                data-testid={`member-row-${g.id}`}
                className="flex items-center justify-between gap-2 rounded-md border border-[var(--color-outline-variant)] px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-[var(--color-on-surface)]">
                      {g.fullName}
                    </span>
                    {isPrimary ? (
                      <Badge tone="gold">{t('guests:groups.primaryBadge')}</Badge>
                    ) : null}
                  </div>
                  {(g.email || g.phone) ? (
                    <div className="truncate text-xs text-[var(--color-secondary)]">
                      {g.email}
                      {g.email && g.phone ? ' · ' : ''}
                      {g.phone}
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!isPrimary ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPrimary.mutate(g.id)}
                      title={t('guests:groups.markPrimary')}
                      aria-label={t('guests:groups.markPrimary')}
                      data-testid={`member-make-primary-${g.id}`}
                    >
                      <Star className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                  {!isPrimary ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(t('guests:groups.removeMemberConfirm'))) {
                          removeMember.mutate(g.id);
                        }
                      }}
                      title={t('guests:groups.removeMember')}
                      aria-label={t('guests:groups.removeMember')}
                      data-testid={`member-remove-${g.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-[var(--color-destructive)]" />
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AddMemberForm({
  groupId,
  submitting,
  error,
  onSubmit,
  onCancel,
}: {
  groupId: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (dto: CreateGuestRequest) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation(['guests', 'common']);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateGuestRequest>({
    defaultValues: { groupId, fullName: '', email: '', phone: '' },
  });

  const onSubmitValid = (state: CreateGuestRequest) => {
    onSubmit({
      groupId: state.groupId || groupId,
      fullName: state.fullName.trim(),
      email: state.email?.trim() || undefined,
      phone: state.phone?.trim() || undefined,
    });
    reset({ groupId, fullName: '', email: '', phone: '' });
  };

  return (
    <form onSubmit={handleSubmit(onSubmitValid)} className="space-y-2 rounded-md border border-[var(--color-outline-variant)] p-3">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <FieldShell
          label={t('guests:guest.fullName')}
          required
          error={errors.fullName?.message}
          className="md:col-span-2"
        >
          <Input
            {...register('fullName', { required: 'Required' })}
            placeholder={t('guests:groups.fields.fullNamePlaceholder')}
          />
        </FieldShell>
        <FieldShell label={t('guests:guest.email')}>
          <Input type="email" {...register('email')} />
        </FieldShell>
        <FieldShell label={t('guests:guest.phone')}>
          <Input type="tel" {...register('phone')} />
        </FieldShell>
      </div>
      {error ? (
        <div className="rounded border-l-4 border-destructive bg-error-container/30 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          {t('common:actions.cancel')}
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? t('common:actions.saving') : t('guests:groups.addMember')}
        </Button>
      </div>
    </form>
  );
}

export { CardTitle, CardHeader };
