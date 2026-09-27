import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, X } from 'lucide-react';

import { Button } from '@/shared/ui';

export type DeleteGroupChoice = 'cancel' | 'delete-group-only' | 'delete-all';

interface DeleteGroupDialogProps {
  open: boolean;
  groupName: string;
  memberCount: number;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (choice: Exclude<DeleteGroupChoice, 'cancel'>) => void;
}

/**
 * Confirmation dialog for deleting a group that already has members.
 *
 * Two destructive options, presented in order of severity:
 *   - "delete-all":           group AND its members are removed
 *   - "delete-group-only":    group is removed, members move to "Unassigned"
 *
 * The default selection is the least destructive (`delete-group-only`)
 * to prevent accidental data loss. If the group has 0 members, this
 * dialog should not be used — a plain `window.confirm` is enough.
 */
export function DeleteGroupDialog({
  open,
  groupName,
  memberCount,
  busy,
  onCancel,
  onConfirm,
}: DeleteGroupDialogProps): React.ReactElement | null {
  const { t } = useTranslation('guests');
  const [choice, setChoice] = useState<'delete-group-only' | 'delete-all'>(
    'delete-group-only',
  );

  if (!open) return null;

  const confirmLabel =
    choice === 'delete-all'
      ? t('deleteGroupDialog.confirmDeleteAll')
      : t('deleteGroupDialog.confirmDeleteGroupOnly');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-group-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      data-testid="delete-group-dialog"
    >
      <div className="w-full max-w-md rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-error-container)] text-[var(--color-destructive)]">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <h3
              id="delete-group-dialog-title"
              className="text-base font-semibold text-[var(--color-on-surface)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('deleteGroupDialog.title', { name: groupName })}
            </h3>
          </div>
          <button
            type="button"
            aria-label={t('common:actions.close')}
            onClick={onCancel}
            className="text-[var(--color-secondary)] hover:text-[var(--color-on-surface)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-sm text-[var(--color-secondary)]">
          {t('deleteGroupDialog.subtitleWithMembers', { count: memberCount })}
        </p>

        <div className="mt-4 space-y-2">
          <Choice
            selected={choice === 'delete-group-only'}
            onSelect={() => setChoice('delete-group-only')}
            testId="delete-group-only"
            label={t('deleteGroupDialog.optionDeleteGroupOnly')}
            help={t('deleteGroupDialog.optionDeleteGroupOnlyHelp')}
          />
          <Choice
            selected={choice === 'delete-all'}
            onSelect={() => setChoice('delete-all')}
            testId="delete-all"
            destructive
            label={t('deleteGroupDialog.optionDeleteAll', { count: memberCount })}
            help={t('deleteGroupDialog.optionDeleteAllHelp')}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="button"
            variant={choice === 'delete-all' ? 'destructive' : 'default'}
            onClick={() => onConfirm(choice)}
            disabled={busy}
            data-testid="delete-group-confirm"
          >
            {busy ? t('common:actions.saving') : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Choice({
  selected,
  onSelect,
  label,
  help,
  destructive,
  testId,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  help: string;
  destructive?: boolean;
  testId: string;
}): React.ReactElement {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      data-testid={testId}
      className={
        'w-full rounded-md border px-3 py-3 text-left transition-colors ' +
        (selected
          ? destructive
            ? 'border-[var(--color-destructive)] bg-[var(--color-error-container)]/40'
            : 'border-[var(--color-primary)] bg-[var(--color-secondary-container)]/40'
          : 'border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)]')
      }
    >
      <div className="flex items-center gap-2">
        <span
          className={
            'inline-block h-3 w-3 rounded-full border-2 ' +
            (selected
              ? destructive
                ? 'border-[var(--color-destructive)] bg-[var(--color-destructive)]'
                : 'border-[var(--color-primary)] bg-[var(--color-primary)]'
              : 'border-[var(--color-outline)]')
          }
        />
        <span className="text-sm font-medium text-[var(--color-on-surface)]">{label}</span>
      </div>
      <p className="mt-1 pl-5 text-xs text-[var(--color-secondary)]">{help}</p>
    </button>
  );
}
