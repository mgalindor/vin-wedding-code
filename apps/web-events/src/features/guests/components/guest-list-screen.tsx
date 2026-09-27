import { useParams } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, HelpCircle, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useGuestsService } from '@/features/guests/guests.service';
import type { CreateGuestRequest, Guest, RsvpUpdateRequest } from '@/shared/api';
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  FieldShell,
  Input,
  Select,
  Spinner,
  Textarea,
} from '@/shared/ui';

type RsvpFilter = 'all' | 'pending' | 'confirmed' | 'declined';

const RSVP_TONE: Record<Guest['rsvpStatus'], 'success' | 'warning' | 'danger'> = {
  confirmed: 'success',
  pending: 'warning',
  declined: 'danger',
};

/**
 * Guest management view — combines:
 *   - search box and RSVP filter
 *   - per-guest RSVP quick actions (the most common operation)
 *   - "add guest" form (creates in the first group, or in a chosen group)
 *
 * Designers noted that organizers want the RSVP action to be the
 * fastest possible — single click, optimistic update, no navigation.
 */
export function GuestListScreen(): React.ReactElement {
  const params = useParams({ strict: false }) as { eventId?: string };
  const eventId = params.eventId ?? '';
  const service = useGuestsService();
  const qc = useQueryClient();
  const { t } = useTranslation(['guests', 'common']);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<RsvpFilter>('all');
  const [showAdd, setShowAdd] = useState(false);

  const groups = useQuery({
    queryKey: ['guests', 'groups', eventId],
    queryFn: () => service.listGroups(eventId).then((r) => r.items ?? []),
    enabled: Boolean(eventId),
  });

  const guests = useQuery({
    queryKey: ['guests', 'list', eventId, { search, status }],
    queryFn: () =>
      service.listGuests(eventId, {
        search: search || undefined,
        rsvpStatus: status === 'all' ? undefined : status,
        size: 200,
      }),
    enabled: Boolean(eventId),
  });

  const counts = useMemo(() => {
    const c: Record<'pending' | 'confirmed' | 'declined', number> = {
      pending: 0,
      confirmed: 0,
      declined: 0,
    };
    if (guests.data) {
      for (const g of guests.data.items) c[g.rsvpStatus] += 1;
    }
    return c;
  }, [guests.data]);

  const updateRsvp = useMutation({
    mutationFn: ({ guestId, dto }: { guestId: string; dto: RsvpUpdateRequest }) =>
      service.markGuestRsvp(eventId, guestId, dto),
    onMutate: async ({ guestId, dto }) => {
      await qc.cancelQueries({ queryKey: ['guests', 'list', eventId] });
      const previous = qc.getQueryData(['guests', 'list', eventId]);
      qc.setQueryData(
        ['guests', 'list', eventId],
        (old: { items: Guest[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((g) =>
              g.id === guestId
                ? { ...g, rsvpStatus: dto.rsvpStatus }
                : g,
            ),
          };
        },
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(['guests', 'list', eventId], context.previous);
      }
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ['guests', 'list', eventId] }),
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-8 py-8" data-testid="guest-list">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight text-[var(--color-on-surface)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('guests:title')}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--color-secondary)]">
            {t('guests:subtitle')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="success">{counts.confirmed} {t('guests:status.confirmed')}</Badge>
            <Badge tone="warning">{counts.pending} {t('guests:status.pending')}</Badge>
            <Badge tone="danger">{counts.declined} {t('guests:status.declined')}</Badge>
          </div>
        </div>
        <Button onClick={() => setShowAdd((v) => !v)} variant={showAdd ? 'outline' : 'default'}>
          {showAdd ? t('common:actions.cancel') : '+ ' + t('guests:guest.add')}
        </Button>
      </header>

      {showAdd && (
        <Card>
          <CardContent>
            <AddGuestForm
              groups={groups.data ?? []}
              onCancel={() => setShowAdd(false)}
              onCreated={() => {
                setShowAdd(false);
                void qc.invalidateQueries({ queryKey: ['guests', 'list', eventId] });
              }}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="grow">
              <Input
                placeholder={t('guests:list.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={status} onChange={(e) => setStatus(e.target.value as RsvpFilter)} className="w-44">
              <option value="all">{t('guests:list.filterBy.all')}</option>
              <option value="pending">{t('guests:list.filterBy.pending')}</option>
              <option value="confirmed">{t('guests:list.filterBy.confirmed')}</option>
              <option value="declined">{t('guests:list.filterBy.declined')}</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {guests.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !guests.data || guests.data.items.length === 0 ? (
        <EmptyState title={t('guests:list.noGuests')} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] shadow-[var(--shadow-card)]">
          <table className="w-full border-collapse" style={{ minWidth: 720 }}>
            <thead>
              <tr className="border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]">
                <Th>Guest</Th>
                <Th>Contact</Th>
                <Th>Group</Th>
                <Th>Status</Th>
                <Th className="text-right">Quick actions</Th>
              </tr>
            </thead>
            <tbody>
              {guests.data.items.map((g) => (
                <tr
                  key={g.id}
                  data-testid={`guest-row-${g.id}`}
                  className="border-b border-[var(--color-outline-variant)] transition-colors hover:bg-[var(--color-surface-container-low)]"
                >
                  <Td>
                    <div className="font-medium text-[var(--color-on-surface)]">
                      {g.fullName}
                    </div>
                    {g.dietaryNotes && (
                      <div className="text-xs italic text-[var(--color-secondary)]">
                        {g.dietaryNotes}
                      </div>
                    )}
                  </Td>
                  <Td>
                    <div className="text-xs">{g.email}</div>
                    <div className="text-xs text-[var(--color-secondary)]">{g.phone}</div>
                  </Td>
                  <Td>
                    <code className="font-mono text-xs">{g.groupId.slice(0, 6)}…</code>
                  </Td>
                  <Td>
                    <Badge tone={RSVP_TONE[g.rsvpStatus]}>{t(`guests:status.${g.rsvpStatus}`)}</Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <RsvpButton
                        tone="success"
                        icon={Check}
                        label={t('guests:rsvp.markConfirmed')}
                        active={g.rsvpStatus === 'confirmed'}
                        onClick={() =>
                          updateRsvp.mutate({
                            guestId: g.id,
                            dto: { rsvpStatus: 'confirmed' },
                          })
                        }
                      />
                      <RsvpButton
                        tone="warning"
                        icon={HelpCircle}
                        label={t('guests:rsvp.markPending')}
                        active={g.rsvpStatus === 'pending'}
                        onClick={() =>
                          updateRsvp.mutate({
                            guestId: g.id,
                            dto: { rsvpStatus: 'pending' },
                          })
                        }
                      />
                      <RsvpButton
                        tone="danger"
                        icon={X}
                        label={t('guests:rsvp.markDeclined')}
                        active={g.rsvpStatus === 'declined'}
                        onClick={() =>
                          updateRsvp.mutate({
                            guestId: g.id,
                            dto: { rsvpStatus: 'declined' },
                          })
                        }
                      />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RsvpButton({
  tone,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  tone: 'success' | 'warning' | 'danger';
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={
        'flex h-8 w-8 items-center justify-center rounded-md transition-colors ' +
        (active ? 'bg-[var(--color-surface-container-high)]' : 'hover:bg-[var(--color-surface-container-low)]') +
        ' ' +
        (tone === 'success'
          ? 'text-[var(--color-status-confirmed-text)]'
          : tone === 'warning'
            ? 'text-[var(--color-status-pending-text)]'
            : 'text-[var(--color-status-declined-text)]')
      }
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={
        'px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)] ' +
        (className ?? '')
      }
    >
      {children}
    </th>
  );
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td
      className={
        'px-4 py-3 text-sm text-[var(--color-on-surface)] ' + (className ?? '')
      }
    >
      {children}
    </td>
  );
}

function AddGuestForm({
  groups,
  onCancel,
  onCreated,
}: {
  groups: { id: string; name: string }[];
  onCancel: () => void;
  onCreated: () => void;
}) {
  const params = useParams({ strict: false }) as { eventId?: string };
  const eventId = params.eventId ?? '';
  const service = useGuestsService();
  const { t } = useTranslation(['guests', 'common']);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateGuestRequest>({
    defaultValues: {
      groupId: groups[0]?.id ?? '',
      fullName: '',
      email: '',
      phone: '',
      dietaryNotes: '',
    },
  });

  const onSubmitValid = async (state: CreateGuestRequest) => {
    setSubmitting(true);
    try {
      await service.createGuest(eventId, {
        ...state,
        email: state.email || undefined,
        phone: state.phone || undefined,
        dietaryNotes: state.dietaryNotes || undefined,
      });
      reset();
      onCreated();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitValid)} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FieldShell label={t('guests:guest.fullName')} required error={errors.fullName?.message} className="md:col-span-2">
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
        <FieldShell label={t('guests:guest.addToExistingGroup')} className="md:col-span-2">
          <Select {...register('groupId')}>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </FieldShell>
        <FieldShell label={t('guests:guest.dietaryNotes')} className="md:col-span-2">
          <Textarea rows={2} {...register('dietaryNotes')} />
        </FieldShell>
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common:actions.cancel')}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? t('common:actions.saving') : t('guests:guest.add')}
        </Button>
      </div>
    </form>
  );
}
