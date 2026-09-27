import { Link } from '@tanstack/react-router';
import { ChevronRight, Copy, Link2, RefreshCw, Trash2, Users2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { GuestGroup } from '@/shared/api';
import { Badge, Button, Card, CardContent, Spinner } from '@/shared/ui';

import { GroupMembers } from './group-members';

interface GroupCardProps {
  group: GuestGroup;
  guestCount: number;
  slug: string | null;
  eventId: string;
  defaultExpanded?: boolean;
  onCopyLink: (group: GuestGroup) => Promise<void>;
  onRegenerate: (group: GuestGroup) => void;
  onDelete: (group: GuestGroup) => void;
}

/**
 * Single-group card used inside the `Groups` view of the unified
 * guest-management screen. Owns its own expand/collapse state; members
 * are fetched on demand by `<GroupMembers>`.
 */
export function GroupCard({
  group,
  guestCount,
  slug,
  eventId,
  defaultExpanded = false,
  onCopyLink,
  onRegenerate,
  onDelete,
}: GroupCardProps): React.ReactElement {
  const { t } = useTranslation(['guests', 'common']);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleCopy = async () => {
    await onCopyLink(group);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleDelete = () => {
    // The parent decides whether to show the "with-members" dialog or
    // just a plain confirm (0/1 members). We pass the whole group so
    // the parent has the count and can short-circuit when needed.
    onDelete(group);
  };

  return (
    <Card data-testid={`group-card-${group.id}`}>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRegenerate(group)}
              aria-label={t('guests:groups.regenerateToken')}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              aria-label={t('guests:groups.deleteGroup')}
              data-testid={`delete-group-${group.id}`}
            >
              <Trash2 className="h-3.5 w-3.5 text-[var(--color-destructive)]" />
            </Button>
          </div>
        </div>

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

        {expanded ? (
          <GroupMembers
            eventId={eventId}
            groupId={group.id}
            primaryGuestId={group.primaryGuestId ?? null}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

// Re-exported so the parent screen can render an inline "loading"
// placeholder while the groups query is in flight.
export { Spinner };
