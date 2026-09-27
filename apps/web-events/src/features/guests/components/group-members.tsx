import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useGuestsService } from '@/features/guests/guests.service';
import type { CreateGuestRequest } from '@/shared/api';
import { Badge, Button, FieldShell, Input, Spinner } from '@/shared/ui';

interface GroupMembersProps {
  eventId: string;
  groupId: string;
  primaryGuestId: string | null;
}

/**
 * Member-list section shown when the user expands a group card. Owns
 * its own `guests` query so we don't over-fetch when most groups stay
 * collapsed; invalidates the local query and the parent's counts query
 * when members are added / removed / re-marked.
 */
export function GroupMembers({
  eventId,
  groupId,
  primaryGuestId,
}: GroupMembersProps): React.ReactElement {
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
      void qc.invalidateQueries({ queryKey: ['guests', 'groups', eventId] });
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
}): React.ReactElement {
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
    <form
      onSubmit={handleSubmit(onSubmitValid)}
      className="space-y-2 rounded-md border border-[var(--color-outline-variant)] p-3"
    >
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
