import { useNavigate, useParams } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, HelpCircle, Pencil, Plus, Trash2, UsersRound, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useGuestsService } from '@/features/guests/guests.service';
import type {
  ChangeGuestGroupRequest,
  CreateGuestGroupRequest,
  CreateGuestRequest,
  Guest,
  GuestGroup,
  RsvpUpdateRequest,
  UpdateGuestRequest,
} from '@/shared/api';
import { useApiClient, type EventInvitationConfig } from '@/shared/api';
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

import { CreateGroupForm } from './create-group-form';
import {
  DeleteGroupDialog,
  type DeleteGroupChoice,
} from './delete-group-dialog';
import { GroupCard } from './group-card';
import { useGuestViewPersistence } from '../hooks/use-guest-view-mode';
import { SegmentedView } from './segmented-view';

type RsvpFilter = 'all' | 'pending' | 'confirmed' | 'declined';

const RSVP_TONE: Record<Guest['rsvpStatus'], 'success' | 'warning' | 'danger'> = {
  confirmed: 'success',
  pending: 'warning',
  declined: 'danger',
};

/**
 * Unified guest management screen.
 *
 * Replaces the previous `GuestGroupsScreen` + `GuestListScreen` pair
 * with a single component that owns:
 *   - The view-mode toggle (flat list ↔ groups) persisted per event
 *   - Both view bodies (Groups and Flat list) sharing the same queries
 *   - The "Unassigned" guests section shown at the bottom of the
 *     Groups view
 *   - The 3-option confirmation dialog when deleting a group with
 *     members
 *
 * Why one screen instead of two:
 *   - State (active view, group selection, pending deletes) is shared
 *   - Queries are reused — `groups` and `allGuests` are fetched once
 *     and consumed by both bodies
 *   - Persisted view mode belongs with the screen that owns the UI
 */
export function GuestManagementScreen(): React.ReactElement {
  const params = useParams({ strict: false }) as { eventId?: string };
  const eventId = params.eventId ?? '';
  const service = useGuestsService();
  const qc = useQueryClient();
  const api = useApiClient();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['guests', 'common']);
  const { view, setView } = useGuestViewPersistence(eventId);

  // ---- shared state ----
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<RsvpFilter>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GuestGroup | null>(null);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [autoExpandedGroupId, setAutoExpandedGroupId] = useState<string | null>(null);

  // ---- shared queries ----
  const groups = useQuery({
    queryKey: ['guests', 'groups', eventId],
    queryFn: () => service.listGroups(eventId).then((r) => r.items ?? []),
    enabled: Boolean(eventId),
  });

  // Walk the first page to know all guests (regardless of group).
  // The BE doesn't expose an "unassigned" filter yet, so we bucket
  // client-side. Cheap for the realistic event sizes (<500 guests).
  const allGuests = useQuery({
    queryKey: ['guests', 'counts', eventId],
    queryFn: () =>
      service.listGuests(eventId, { size: 200 }).then((p) => p.items ?? []),
    enabled: Boolean(eventId),
  });

  const invitationConfig = useQuery({
    queryKey: ['events', 'invitation-config', eventId],
    queryFn: () =>
      api.get<EventInvitationConfig>(`/events/${eventId}/invitation-config`),
    enabled: Boolean(eventId),
  });
  const slug = invitationConfig.data?.slug ?? null;

  // ---- derivations ----
  const guestCountByGroup = useMemo(() => {
    const m: Record<string, number> = {};
    for (const g of allGuests.data ?? []) m[g.groupId] = (m[g.groupId] ?? 0) + 1;
    return m;
  }, [allGuests.data]);

  const knownGroupIds = useMemo(
    () => new Set((groups.data ?? []).map((g) => g.id)),
    [groups.data],
  );

  // Guests whose groupId no longer corresponds to an existing group
  // (orphan) or who were created standalone and never assigned. We
  // treat them uniformly as "Unassigned".
  const unassignedGuests = useMemo(
    () => (allGuests.data ?? []).filter((g) => !knownGroupIds.has(g.groupId)),
    [allGuests.data, knownGroupIds],
  );

  const memberCountOf = (g: GuestGroup): number => guestCountByGroup[g.id] ?? 0;

  // Flat list filtering — the simple view consumes the same allGuests
  // query but applies search + RSVP filter client-side to avoid the
  // 200-row server cap.
  const filteredFlat = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (allGuests.data ?? []).filter((g) => {
      if (status !== 'all' && g.rsvpStatus !== status) return false;
      if (!term) return true;
      return g.fullName.toLowerCase().includes(term);
    });
  }, [allGuests.data, search, status]);

  // ---- mutations ----
  const createGroup = useMutation({
    mutationFn: (dto: CreateGuestGroupRequest) => service.createGroup(eventId, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['guests', 'groups', eventId] });
      void qc.invalidateQueries({ queryKey: ['guests', 'counts', eventId] });
      void qc.invalidateQueries({ queryKey: ['guests', 'list', eventId] });
      setShowCreateGroup(false);
    },
  });

  const regenerateToken = useMutation({
    mutationFn: (groupId: string) =>
      service.regenerateGroupToken(eventId, groupId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['guests', 'groups', eventId] }),
  });

  const removeGroup = useMutation({
    mutationFn: (groupId: string) => service.deleteGroup(eventId, groupId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['guests', 'groups', eventId] });
      void qc.invalidateQueries({ queryKey: ['guests', 'counts', eventId] });
      void qc.invalidateQueries({ queryKey: ['guests', 'list', eventId] });
    },
  });

  // "Delete only the group": move every member to the first existing
  // group as a best-effort. We pick the first group because the wire
  // shape requires `groupId` to be non-null on guests; the UI then
  // surfaces them under "Unassigned" if their group disappears, or
  // reassigns them if the user picks one explicitly via the chip.
  const reassignMembers = useMutation({
    mutationFn: async ({ fromGroupId, toGroupId }: { fromGroupId: string; toGroupId: string }) => {
      const members = (allGuests.data ?? []).filter((g) => g.groupId === fromGroupId);
      await Promise.all(
        members.map((m) =>
          service.changeGuestGroup(eventId, m.id, { groupId: toGroupId } satisfies ChangeGuestGroupRequest),
        ),
      );
    },
  });

  const updateRsvp = useMutation({
    mutationFn: ({ guestId, dto }: { guestId: string; dto: RsvpUpdateRequest }) =>
      service.markGuestRsvp(eventId, guestId, dto),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['guests', 'counts', eventId] }),
  });

  // ---- helpers ----
  const copyLink = async (g: GuestGroup): Promise<void> => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = slug
      ? `${origin}/i/${slug}/g/${g.invitationToken}`
      : `${origin}/i/${g.invitationToken}`;
    await navigator.clipboard.writeText(url);
  };

  const handleDeleteGroup = (g: GuestGroup): void => {
    const count = memberCountOf(g);
    // 0/1 members: short-circuit with a plain confirm.
    if (count <= 1) {
      const msg =
        count === 0
          ? t('guests:groups.deleteGroup')
          : t('guests:groups.removeMemberConfirm');
      if (window.confirm(msg)) removeGroup.mutate(g.id);
      return;
    }
    setDeleteTarget(g);
  };

  const confirmDeleteGroup = (
    choice: Exclude<DeleteGroupChoice, 'cancel'>,
  ): void => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    const count = memberCountOf(deleteTarget);
    setDeleteTarget(null);

    if (choice === 'delete-all') {
      // Delete members first, then the group. Order matters because
      // the BE's referential integrity may reject a group with guests.
      const members = (allGuests.data ?? []).filter((g) => g.groupId === targetId);
      Promise.all(members.map((m) => service.deleteGuest(eventId, m.id)))
        .then(() => removeGroup.mutate(targetId))
        .catch(() => {
          void qc.invalidateQueries({ queryKey: ['guests', 'groups', eventId] });
          void qc.invalidateQueries({ queryKey: ['guests', 'counts', eventId] });
        });
      return;
    }

    if (choice === 'delete-group-only') {
      // Move members into the first remaining group so the wire shape
      // stays valid. They show up under "Unassigned" if no group is
      // left.
      const fallback = (groups.data ?? []).find((g) => g.id !== targetId);
      if (!fallback) {
        // No other group to move to — just delete the group; the
        // members become orphans and we surface them in Unassigned.
        removeGroup.mutate(targetId);
      } else {
        reassignMembers.mutate(
          { fromGroupId: targetId, toGroupId: fallback.id },
          {
            onSuccess: () => {
              removeGroup.mutate(targetId);
            },
          },
        );
      }
      return;
    }

    void count; // satisfies unused-var lint if logic shifts
  };

  const handleChipClick = (groupId: string): void => {
    // Decision B1: jumping from the chip on the flat view switches
    // to the groups view AND expands that specific group so the user
    // lands on the right context.
    setAutoExpandedGroupId(groupId);
    setView('groups');
  };

  // ---- counters in header ----
  const counts = useMemo(() => {
    const c: Record<'pending' | 'confirmed' | 'declined', number> = {
      pending: 0,
      confirmed: 0,
      declined: 0,
    };
    for (const g of allGuests.data ?? []) c[g.rsvpStatus] += 1;
    return c;
  }, [allGuests.data]);

  const totalGuests = allGuests.data?.length ?? 0;
  const totalGroups = groups.data?.length ?? 0;

  const subtitle =
    view === 'simple' ? t('guests:views.simpleHelp') : t('guests:views.groupsHelp');

  return (
    <div
      className="mx-auto w-full max-w-5xl space-y-6 px-8 py-8"
      data-testid="guest-management"
    >
      {/* Header */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1
              className="text-3xl font-bold tracking-tight text-[var(--color-on-surface)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('guests:title')}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-[var(--color-secondary)]">
              {subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SegmentedView value={view} onChange={setView} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge tone="success">{counts.confirmed} {t('guests:status.confirmed')}</Badge>
            <Badge tone="warning">{counts.pending} {t('guests:status.pending')}</Badge>
            <Badge tone="danger">{counts.declined} {t('guests:status.declined')}</Badge>
            <Badge tone="neutral">
              {t('guests:views.counter', {
                guests: totalGuests,
                groups: totalGroups,
              })}
            </Badge>
          </div>
          {view === 'groups' ? (
            <Button
              onClick={() => setShowCreateGroup((v) => !v)}
              variant={showCreateGroup ? 'outline' : 'default'}
            >
              <UsersRound className="h-4 w-4" />{' '}
              {showCreateGroup ? t('common:actions.cancel') : t('guests:groups.addGroup')}
            </Button>
          ) : (
            <Button
              onClick={() => setShowAdd((v) => !v)}
              variant={showAdd ? 'outline' : 'default'}
            >
              <Plus className="h-4 w-4" />{' '}
              {showAdd ? t('common:actions.cancel') : t('guests:guest.add')}
            </Button>
          )}
        </div>
      </header>

      {/* Create group form (groups view only) */}
      {view === 'groups' && showCreateGroup ? (
        <Card>
          <CardContent>
            <CreateGroupForm
              submitting={createGroup.isPending}
              error={
                createGroup.error instanceof Error
                  ? createGroup.error.message
                  : null
              }
              onCancel={() => setShowCreateGroup(false)}
              onSubmit={(dto) => createGroup.mutate(dto)}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Add guest form (flat view only) */}
      {view === 'simple' && showAdd ? (
        <Card>
          <CardContent>
            <AddGuestForm
              groups={groups.data ?? []}
              unassignedCount={unassignedGuests.length}
              onCancel={() => setShowAdd(false)}
              onCreated={() => {
                setShowAdd(false);
                void qc.invalidateQueries({ queryKey: ['guests', 'counts', eventId] });
                void qc.invalidateQueries({ queryKey: ['guests', 'groups', eventId] });
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Body */}
      {allGuests.isLoading || groups.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : view === 'simple' ? (
        <SimpleListView
          guests={filteredFlat}
          groups={groups.data ?? []}
          eventId={eventId}
          search={search}
          status={status}
          onSearch={setSearch}
          onStatus={setStatus}
          onRsvp={(guestId, dto) => updateRsvp.mutate({ guestId, dto })}
          onEditGuest={(g) => setEditingGuest(g)}
          onRemoveGuest={(guestId, guestName) => {
            if (window.confirm(t('guests:guest.removeConfirm', { name: guestName }))) {
              service.deleteGuest(eventId, guestId).then(() => {
                void qc.invalidateQueries({ queryKey: ['guests', 'list', eventId] });
                void qc.invalidateQueries({ queryKey: ['guests', 'counts', eventId] });
                void qc.invalidateQueries({ queryKey: ['guests', 'groups', eventId] });
              });
            }
          }}
          onChipClick={handleChipClick}
          navigateToGroup={() => navigate({ to: '/dashboard/events/$eventId/guests', params: { eventId } })}
        />
      ) : (
        <GroupsView
          groups={groups.data ?? []}
          unassigned={unassignedGuests}
          memberCountOf={memberCountOf}
          slug={slug}
          eventId={eventId}
          autoExpandedGroupId={autoExpandedGroupId}
          onCopyLink={copyLink}
          onRegenerate={(g) => regenerateToken.mutate(g.id)}
          onDelete={handleDeleteGroup}
          onAssignGroup={(guestId, groupId) =>
            service.changeGuestGroup(eventId, guestId, { groupId }).then(() => {
              void qc.invalidateQueries({ queryKey: ['guests', 'counts', eventId] });
              void qc.invalidateQueries({ queryKey: ['guests', 'groups', eventId] });
            })
          }
        />
      )}

      <DeleteGroupDialog
        open={deleteTarget !== null}
        groupName={deleteTarget?.name ?? ''}
        memberCount={deleteTarget ? memberCountOf(deleteTarget) : 0}
        busy={removeGroup.isPending || reassignMembers.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteGroup}
      />

      <EditGuestDialog
        guest={editingGuest}
        groups={groups.data ?? []}
        eventId={eventId}
        onClose={() => setEditingGuest(null)}
      />
    </div>
  );
}

// ===========================================================================
// Sub-views
// ===========================================================================

interface SimpleListViewProps {
  guests: Guest[];
  groups: GuestGroup[];
  eventId: string;
  search: string;
  status: RsvpFilter;
  onSearch: (s: string) => void;
  onStatus: (s: RsvpFilter) => void;
  onRsvp: (guestId: string, dto: RsvpUpdateRequest) => void;
  onEditGuest: (guest: Guest) => void;
  onRemoveGuest: (guestId: string, guestName: string) => void;
  onChipClick: (groupId: string) => void;
  navigateToGroup: () => void;
}

function SimpleListView({
  guests,
  groups,
  search,
  status,
  onSearch,
  onStatus,
  onRsvp,
  onEditGuest,
  onRemoveGuest,
  onChipClick,
}: SimpleListViewProps): React.ReactElement {
  const { t } = useTranslation(['guests', 'common']);
  const groupNameById = useMemo(
    () => Object.fromEntries(groups.map((g) => [g.id, g.name])),
    [groups],
  );

  if (guests.length === 0) {
    return (
      <EmptyState
        title={t('guests:list.noGuests')}
        action={
          <Button onClick={() => onStatus('all')}>{t('common:actions.retry')}</Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="grow">
              <Input
                placeholder={t('guests:list.search')}
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                className="max-w-sm"
                data-testid="guest-search"
              />
            </div>
            <Select
              value={status}
              onChange={(e) => onStatus(e.target.value as RsvpFilter)}
              className="w-44"
              data-testid="guest-status-filter"
            >
              <option value="all">{t('guests:list.filterBy.all')}</option>
              <option value="pending">{t('guests:list.filterBy.pending')}</option>
              <option value="confirmed">{t('guests:list.filterBy.confirmed')}</option>
              <option value="declined">{t('guests:list.filterBy.declined')}</option>
            </Select>
          </div>
        </CardContent>
      </Card>

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
            {guests.map((g) => {
              const groupName = groupNameById[g.groupId];
              const hasGroup = Boolean(groupName);
              return (
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
                    {hasGroup ? (
                      <button
                        type="button"
                        onClick={() => onChipClick(g.groupId)}
                        data-testid={`guest-group-chip-${g.id}`}
                        className="inline-flex items-center rounded-full border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] px-2 py-0.5 text-xs font-medium text-[var(--color-on-surface)] transition-colors hover:bg-[var(--color-surface-container-high)]"
                        title={t('guests:views.groupsHelp')}
                      >
                        {groupName}
                      </button>
                    ) : (
                      <Badge tone="neutral">{t('guests:groupChip.noGroup')}</Badge>
                    )}
                  </Td>
                  <Td>
                    <Badge tone={RSVP_TONE[g.rsvpStatus]}>
                      {t(`guests:status.${g.rsvpStatus}`)}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <RsvpButton
                        tone="success"
                        icon={Check}
                        label={t('guests:rsvp.markConfirmed')}
                        active={g.rsvpStatus === 'confirmed'}
                        onClick={() =>
                          onRsvp(g.id, { status: 'confirmed' })
                        }
                      />
                      <RsvpButton
                        tone="warning"
                        icon={HelpCircle}
                        label={t('guests:rsvp.markPending')}
                        active={g.rsvpStatus === 'pending'}
                        onClick={() =>
                          onRsvp(g.id, { status: 'pending' })
                        }
                      />
                      <RsvpButton
                        tone="danger"
                        icon={X}
                        label={t('guests:rsvp.markDeclined')}
                        active={g.rsvpStatus === 'declined'}
                        onClick={() =>
                          onRsvp(g.id, { status: 'declined' })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => onEditGuest(g)}
                        title={t('guests:guest.edit')}
                        aria-label={t('guests:guest.edit')}
                        data-testid={`guest-edit-${g.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-secondary)] transition-colors hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveGuest(g.id, g.fullName)}
                        title={t('guests:guest.remove')}
                        aria-label={t('guests:guest.remove')}
                        data-testid={`guest-remove-${g.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-status-declined-text)] transition-colors hover:bg-[var(--color-surface-container-low)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface GroupsViewProps {
  groups: GuestGroup[];
  unassigned: Guest[];
  memberCountOf: (g: GuestGroup) => number;
  slug: string | null;
  eventId: string;
  autoExpandedGroupId: string | null;
  onCopyLink: (g: GuestGroup) => Promise<void>;
  onRegenerate: (g: GuestGroup) => void;
  onDelete: (g: GuestGroup) => void;
  onAssignGroup: (guestId: string, groupId: string) => Promise<unknown>;
}

function GroupsView({
  groups,
  unassigned,
  memberCountOf,
  slug,
  eventId,
  autoExpandedGroupId,
  onCopyLink,
  onRegenerate,
  onDelete,
  onAssignGroup,
}: GroupsViewProps): React.ReactElement {
  const { t } = useTranslation(['guests', 'common']);

  if (groups.length === 0 && unassigned.length === 0) {
    return (
      <EmptyState
        icon={<UsersRound className="h-6 w-6" />}
        title={t('guests:groups.empty')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {groups.length === 0 ? (
        <p className="text-sm text-[var(--color-secondary)]">
          {t('guests:groups.empty')}
        </p>
      ) : (
        <ul className="space-y-3" data-testid="groups-list">
          {groups.map((g) => (
            <li key={g.id}>
              <GroupCard
                group={g}
                guestCount={memberCountOf(g)}
                slug={slug}
                eventId={eventId}
                defaultExpanded={g.id === autoExpandedGroupId}
                onCopyLink={onCopyLink}
                onRegenerate={onRegenerate}
                onDelete={onDelete}
              />
            </li>
          ))}
        </ul>
      )}

      {unassigned.length > 0 ? (
        <section
          className="space-y-2 rounded-lg border border-dashed border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-4"
          data-testid="unassigned-section"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3
                className="text-sm font-semibold text-[var(--color-on-surface)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t('guests:list.unassigned')} ({unassigned.length})
              </h3>
              <p className="text-xs text-[var(--color-secondary)]">
                {t('guests:list.unassignedHint')}
              </p>
            </div>
          </div>
          <ul className="space-y-1">
            {unassigned.map((g) => (
              <li
                key={g.id}
                data-testid={`unassigned-row-${g.id}`}
                className="flex items-center justify-between gap-2 rounded-md border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <span className="truncate text-sm font-medium text-[var(--color-on-surface)]">
                    {g.fullName}
                  </span>
                  <div className="truncate text-xs text-[var(--color-secondary)]">
                    {[g.email, g.phone].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <Select
                  className="w-48"
                  defaultValue=""
                  data-testid={`unassigned-select-${g.id}`}
                  onChange={async (e) => {
                    const newGroupId = e.target.value;
                    if (!newGroupId) return;
                    await onAssignGroup(g.id, newGroupId);
                    e.target.value = '';
                  }}
                >
                  <option value="">{t('guests:groupChip.addToGroup')}</option>
                  {groups.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </Select>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

// ===========================================================================
// Small reusable bits (kept local to avoid bloating shared/ui)
// ===========================================================================

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
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={
        'flex h-8 w-8 items-center justify-center rounded-md transition-colors ' +
        (active
          ? 'bg-[var(--color-surface-container-high)]'
          : 'hover:bg-[var(--color-surface-container-low)]') +
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

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
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

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
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

// ===========================================================================
// Add-guest form (flat view only)
// ===========================================================================

function AddGuestForm({
  groups,
  unassignedCount,
  onCancel,
  onCreated,
}: {
  groups: { id: string; name: string }[];
  unassignedCount: number;
  onCancel: () => void;
  onCreated: () => void;
}): React.ReactElement {
  const params = useParams({ strict: false }) as { eventId?: string };
  const eventId = params.eventId ?? '';
  const service = useGuestsService();
  const { t } = useTranslation(['guests', 'common']);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateGuestRequest & { groupChoice: string }>({
    defaultValues: {
      groupId: '',
      fullName: '',
      email: '',
      phone: '',
      dietaryNotes: '',
      groupChoice: 'unassigned',
    },
  });

  const onSubmitValid = async (state: CreateGuestRequest & { groupChoice: string }) => {
    setSubmitting(true);
    try {
      // Two cases end up creating a group (both use the same backend
      // endpoint, with the guest embedded as the primary contact):
      //   - 'new':    the user picked "Crear un grupo nuevo"
      //   - 'unassigned': the user picked "Sin grupo" — historically the
      //                backend required a groupId, so we routed unassigned
      //                guests through a shared "Sin asignar" group. Now
      //                that the backend accepts `groupId: null` directly,
      //                we still allow that flow but route it through the
      //                dedicated group so the FE keeps a single "Sin
      //                asignar" bucket instead of polluting the list.
      if (state.groupChoice === 'new') {
        await service.createGroup(eventId, {
          name: `${state.fullName.split(' ')[0] || 'Nuevo'} · grupo`,
          relationship: 'other',
          guests: [
            {
              fullName: state.fullName.trim(),
              rsvpStatus: 'pending',
              primary: true,
            },
          ],
        });
        reset();
        onCreated();
        return;
      }

      // 'existing' or 'unassigned' both flow through the regular
      // createGuest endpoint. `groupId` is null when the user picked
      // "Sin grupo" (backend stores the guest with NULL group_id).
      const groupId =
        state.groupChoice === 'existing' && state.groupId ? state.groupId : undefined;

      await service.createGuest(eventId, {
        groupId,
        fullName: state.fullName.trim(),
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
        <FieldShell label={t('guests:guest.addToExistingGroup')} className="md:col-span-2">
          <div className="flex flex-col gap-2">
            <Select {...register('groupChoice')}>
              <option value="unassigned">{t('guests:groupChip.noGroup')}</option>
              {groups.length > 0 ? (
                <optgroup label={t('guests:guest.addToExistingGroup')}>
                  {groups.map((g) => (
                    <option key={g.id} value="existing" data-group-id={g.id}>
                      {g.name}
                  </option>
                  ))}
                </optgroup>
              ) : null}
              <option value="new">{t('guests:guest.createNewGroup')}</option>
            </Select>
            {groups.length > 0 ? (
              <Select
                {...register('groupId')}
                defaultValue={groups[0]?.id ?? ''}
                data-testid="add-guest-group-picker"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            ) : null}
            {unassignedCount > 0 ? (
              <p className="text-xs text-[var(--color-secondary)]">
                {t('guests:list.unassignedHint')}
              </p>
            ) : null}
          </div>
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

/**
 * Inline dialog to edit a guest's name / contact / dietary notes /
 * group. Opens when `guest` is non-null; the parent owns the state.
 * Saving hits `PATCH /events/{id}/guests/{guestId}`.
 */
function EditGuestDialog({
  guest,
  groups,
  eventId,
  onClose,
}: {
  guest: Guest | null;
  groups: GuestGroup[];
  eventId: string;
  onClose: () => void;
}): React.ReactElement | null {
  const { t } = useTranslation(['guests', 'common']);
  const service = useGuestsService();
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateGuestRequest & { groupId?: string }>({
    values: guest
      ? {
          fullName: guest.fullName ?? '',
          email: guest.email ?? '',
          phone: guest.phone ?? '',
          dietaryNotes: guest.dietaryNotes ?? '',
          groupId: guest.groupId ?? '',
        }
      : undefined,
  });

  const update = useMutation({
    mutationFn: (dto: UpdateGuestRequest) =>
      guest ? service.updateGuest(eventId, guest.id, dto) : Promise.reject('no guest'),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['guests', 'list', eventId] });
      void qc.invalidateQueries({ queryKey: ['guests', 'counts', eventId] });
      void qc.invalidateQueries({ queryKey: ['guests', 'groups', eventId] });
      onClose();
    },
  });

  const changeGroup = useMutation({
    mutationFn: (newGroupId: string) =>
      guest
        ? service.changeGuestGroup(eventId, guest.id, { groupId: newGroupId })
        : Promise.reject('no guest'),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['guests', 'list', eventId] });
      void qc.invalidateQueries({ queryKey: ['guests', 'counts', eventId] });
      void qc.invalidateQueries({ queryKey: ['guests', 'groups', eventId] });
    },
  });

  if (!guest) return null;

  const onSubmit = (state: UpdateGuestRequest & { groupId?: string }) => {
    // Build the PATCH body. The backend treats `null` as "untouched" and
    // any explicit empty string as "clear this field" — we want the
    // former for optional fields the user didn't touch.
    const dto: UpdateGuestRequest = {
      fullName: state.fullName?.trim(),
      email: state.email?.trim() || undefined,
      phone: state.phone?.trim() || undefined,
      dietaryNotes: state.dietaryNotes?.trim() || undefined,
    };
    const groupChanged = state.groupId && state.groupId !== guest.groupId;
    update.mutate(dto, {
      onSuccess: () => {
        if (groupChanged) {
          changeGroup.mutate(state.groupId!);
        }
      },
    });
  };

  const busy = update.isPending || changeGroup.isPending;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-guest-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      data-testid="edit-guest-dialog"
    >
      <div className="w-full max-w-md rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-6 shadow-[var(--shadow-card)]">
        <h3
          id="edit-guest-dialog-title"
          className="text-base font-semibold text-[var(--color-on-surface)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('guests:guest.edit')}
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
          <FieldShell
            label={t('guests:guest.fullName')}
            required
            error={errors.fullName?.message}
          >
            <Input {...register('fullName', { required: 'Required' })} />
          </FieldShell>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FieldShell label={t('guests:guest.email')}>
              <Input type="email" {...register('email')} />
            </FieldShell>
            <FieldShell label={t('guests:guest.phone')}>
              <Input type="tel" {...register('phone')} />
            </FieldShell>
          </div>
          <FieldShell label={t('guests:guest.addToExistingGroup')}>
            <Select {...register('groupId')}>
              <option value="">{t('guests:groupChip.noGroup')}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </FieldShell>
          <FieldShell label={t('guests:guest.dietaryNotes')}>
            <Textarea rows={2} {...register('dietaryNotes')} />
          </FieldShell>
          {update.error instanceof Error ? (
            <div className="rounded border-l-4 border-destructive bg-error-container/30 p-3 text-sm text-destructive">
              {update.error.message}
            </div>
          ) : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }} disabled={busy}>
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" disabled={busy} data-testid="edit-guest-save">
              {busy ? t('common:actions.saving') : t('common:actions.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
