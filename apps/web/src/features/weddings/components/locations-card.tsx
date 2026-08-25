import {
  WeddingLocationType,
  type PutWeddingLocationsDto,
  type WeddingDto,
  type WeddingLocationDto,
  type WeddingLocationInputDto,
} from '@wendy/contracts';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useUserInfo } from '@/shared/auth';

import { useWeddingsService } from '../weddings.service';

// US-014a — locations editor.
//
// Renders the live `LocationsCard` for the Wedding Data tab. The
// card mounts with `wedding.locations` from the GET response (no
// extra fetch), tracks local state in a `useState` mirror, and PUTs
// the full ordered array on Save. The server mints row IDs; the FE
// tracks rows by array index during editing and reconciles to the
// server's canonical IDs after every successful PUT.
//
// Read-only posture:
//   - Archived wedding → no editing affordances.
//   - Administrator session → no editing affordances (FE mirrors the
//     BE's read-only posture even though the BE would refuse a write).
//
// Save pip state machine:
//   - pristine  → "✓ N locations" (all rows valid)
//   - dirty     → "⚠ In progress" (any row has a missing/invalid required field)
//   - saving    → "Saving…" (PUT in flight)
//   - saved     → "✓ Saved" (briefly, after success)
//   - error     → "Save failed — try again" (after a non-2xx response)

type SaveState =
  | 'pristine'
  | 'dirty'
  | 'saving'
  | 'saved'
  | 'error';

const VENUE_MAX = 200;
const ADDRESS_MAX = 200;
const CITY_MAX = 200;
const NOTES_MAX = 500;

interface LocationsCardProps {
  wedding: WeddingDto;
}

const inputClass =
  'w-full rounded border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-secondary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/40 disabled:opacity-60';

const selectClass = inputClass;

export function LocationsCard({
  wedding,
}: LocationsCardProps): React.ReactElement {
  const { t } = useTranslation('weddings');
  const service = useWeddingsService();
  const { data: userInfo } = useUserInfo();

  const isArchived = wedding.status === 'archived';
  // The FE mirrors the BE's read-only posture for Administrator
  // sessions (Rule 4) — the BE would refuse the PUT anyway, but the
  // FE never lets the admin even render the editing affordances.
  const isReadOnly = isArchived || userInfo?.role === 'Administrator';

  // Initial local state — seeded from `wedding.locations`. Captured
  // once per upstream `wedding` reference (the same pattern the
  // basic-information card uses to avoid resetting the form on every
  // refetch).
  const initialRef = useRef<WeddingLocationDto[] | null>(null);
  if (initialRef.current === null) {
    initialRef.current = wedding.locations ?? [];
  }
  const initial = initialRef.current;

  const [rows, setRows] = useState<WeddingLocationDto[]>(initial);
  const [saveState, setSaveState] = useState<SaveState>(
    () => (initial.every(isRowValid) ? 'pristine' : 'dirty'),
  );
  const [serverError, setServerError] = useState<string | null>(null);

  // Validation gate — derives `firstInvalidRow` from the local state
  // on every render (no debouncing: this is a small array, well under
  // the MVP scale of ~10 rows).
  const firstInvalidRow = findFirstInvalidRow(rows, t);

  // Status pip label helper — keeps the chip logic centralised.
  const pipLabel = (() => {
    switch (saveState) {
      case 'saving':
        return t('detail.locationsEditor.status.saving');
      case 'saved':
        return t('detail.locationsEditor.status.saved');
      case 'error':
        return t('detail.locationsEditor.status.saveFailed');
      case 'dirty':
        return t('detail.locationsEditor.status.inProgress');
      case 'pristine':
      default:
        return t('detail.locationsEditor.status.savedN', {
          count: rows.length,
        });
    }
  })();

  // The save handler is the single source of truth for the PUT path.
  // Both the chip click and the form submit route through it.
  const persist = async (
    nextRows: WeddingLocationDto[],
  ): Promise<void> => {
    setServerError(null);
    setSaveState('saving');
    try {
      const dto: PutWeddingLocationsDto = {
        locations: nextRows.map(toInputDto),
      };
      const updated = await service.putLocations(wedding.id, dto);
      // Reconcile local state with the server's canonical array
      // (server-stamped ids, normalised whitespace, server-validated
      // dates). React keys now track server IDs, not array indices.
      setRows(updated.locations ?? []);
      setSaveState('saved');
      window.setTimeout(() => {
        setSaveState('pristine');
      }, 1800);
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : t('detail.locationsEditor.errors.saveFailed'),
      );
      setSaveState('error');
    }
  };

  const onSave = async (): Promise<void> => {
    if (firstInvalidRow !== null) return; // belt-and-suspenders
    if (isReadOnly) return; // belt-and-suspenders
    await persist(rows);
  };

  // Add a fresh row at the end. The server will mint the id when the
  // WP clicks Save; the FE tracks the row by its index in the local
  // state until then.
  const onAdd = (): void => {
    const fresh: WeddingLocationDto = {
      // Placeholder id — overwritten by the server on save. Used as a
      // React key (must be unique) and as a stable handle for the
      // row's local edits.
      id: `tmp-${crypto.randomUUID()}` as WeddingLocationDto['id'],
      type: WeddingLocationType.CivilCeremony,
      venueName: '',
      address: '',
      city: '',
      eventDate: wedding.eventDate,
      startTime: null,
      googleMapsLink: null,
      notes: null,
    };
    setRows((prev) => [...prev, fresh]);
    setSaveState('dirty');
  };

  const onRemove = (idx: number): void => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
    setSaveState('dirty');
  };

  const onMove = (idx: number, dir: 'up' | 'down'): void => {
    setRows((prev) => {
      const next = [...prev];
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= next.length) return prev;
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved!);
      return next;
    });
    setSaveState('dirty');
  };

  // Generic field updater. Flips the chip to dirty so the user
  // gets immediate feedback that the form needs saving.
  const updateField = <K extends keyof WeddingLocationDto>(
    idx: number,
    field: K,
    value: WeddingLocationDto[K],
  ): void => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx]!, [field]: value };
      return next;
    });
    setSaveState('dirty');
  };

  const canSave =
    !isReadOnly &&
    saveState !== 'saving' &&
    firstInvalidRow === null;

  const pipState: SaveState = saveState;

  return (
    <section
      data-testid="wedding-data-locations-card"
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-8 py-7"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-secondary)]">
            {t('detail.locationsEditor.cardTitle')}
          </h2>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-[var(--color-secondary)]">
            {t('detail.locationsEditor.subtitle')}
          </p>
        </div>
        <StatusChip
          state={pipState}
          canSave={canSave}
          pipLabel={pipLabel}
          onSave={onSave}
        />
      </div>

      {serverError && (
        <div
          role="alert"
          className="mb-4 rounded border-l-4 border-[var(--color-destructive)] bg-[var(--color-muted)] px-4 py-3 text-sm text-[var(--color-foreground)]"
        >
          {serverError}
        </div>
      )}

      {firstInvalidRow !== null && (
        <p
          role="status"
          aria-live="polite"
          className="mb-4 text-xs text-[var(--color-destructive)]"
        >
          {t('detail.locationsEditor.errors.requiredRow', {
            index: firstInvalidRow + 1,
          })}
        </p>
      )}

      {rows.length === 0 ? (
        <div
          data-testid="locations-empty-state"
          className="rounded border border-dashed border-[var(--color-outline-variant)] bg-[var(--color-muted)] px-4 py-6 text-sm text-[var(--color-secondary)]"
        >
          {t('detail.locationsEditor.emptyHint')}
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row, idx) => (
            <LocationRow
              key={row.id}
              index={idx}
              row={row}
              total={rows.length}
              disabled={isReadOnly}
              onChange={(field, value) => updateField(idx, field, value)}
              onRemove={() => onRemove(idx)}
              onMoveUp={() => onMove(idx, 'up')}
              onMoveDown={() => onMove(idx, 'down')}
            />
          ))}
        </div>
      )}

      {!isReadOnly && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            data-testid="locations-add-button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded border border-[var(--color-primary)] bg-[var(--color-surface-container-lowest)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
          >
            + {t('detail.locationsEditor.addButton')}
          </button>
          <button
            type="button"
            data-testid="locations-save-button"
            onClick={onSave}
            disabled={!canSave || saveState === 'pristine'}
            className="inline-flex items-center gap-2 rounded bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-[var(--color-on-primary)] shadow-sm hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveState === 'saving'
              ? t('detail.locationsEditor.actions.saving')
              : t('detail.locationsEditor.actions.save')}
          </button>
        </div>
      )}
    </section>
  );
}

// US-014a: translate the row state to the wire shape the BE accepts.
// Strip the placeholder `id` (server-minted) and normalise empty
// strings on the optional fields to null so the BE never has to
// re-validate the shape.
function toInputDto(row: WeddingLocationDto): WeddingLocationInputDto {
  return {
    type: row.type,
    venueName: row.venueName,
    address: row.address,
    city: row.city,
    googleMapsLink:
      row.googleMapsLink && row.googleMapsLink.length > 0
        ? row.googleMapsLink
        : null,
    eventDate: row.eventDate,
    startTime:
      row.startTime && row.startTime.length > 0 ? row.startTime : null,
    notes: row.notes && row.notes.length > 0 ? row.notes : null,
  };
}

// US-014a: row-level validation. The chip is disabled when ANY row
// has a missing required field or invalid format. We do the cheap
// shape check (presence + length + URL prefix) here; the BE's
// class-validator decorators are the authoritative source of truth.
function isRowValid(row: WeddingLocationDto): boolean {
  if (!row.venueName.trim()) return false;
  if (!row.address.trim()) return false;
  if (!row.city.trim()) return false;
  if (!row.eventDate) return false;
  if (row.venueName.length > VENUE_MAX) return false;
  if (row.address.length > ADDRESS_MAX) return false;
  if (row.city.length > CITY_MAX) return false;
  if (row.notes && row.notes.length > NOTES_MAX) return false;
  if (row.startTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(row.startTime)) {
    return false;
  }
  if (
    row.googleMapsLink &&
    row.googleMapsLink.length > 0 &&
    !/^https?:\/\//.test(row.googleMapsLink)
  ) {
    return false;
  }
  return true;
}

function findFirstInvalidRow(
  rows: WeddingLocationDto[],
  // i18n is used to label the placeholder rows; the helper does not
  // surface the message itself (the chip's "first-offending-row"
  // helper is rendered separately).
  _t: (key: string) => string,
): number | null {
  for (let i = 0; i < rows.length; i++) {
    if (!isRowValid(rows[i]!)) return i;
  }
  return null;
}

interface LocationRowProps {
  index: number;
  row: WeddingLocationDto;
  total: number;
  disabled: boolean;
  onChange: <K extends keyof WeddingLocationDto>(
    field: K,
    value: WeddingLocationDto[K],
  ) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function LocationRow({
  index,
  row,
  total,
  disabled,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: LocationRowProps): React.ReactElement {
  const { t } = useTranslation('weddings');

  return (
    <article
      data-testid={`location-row-${index}`}
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-5 py-4"
    >
      <header className="mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center rounded-full border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--color-secondary)]">
          Location {index + 1}
        </span>
        {!disabled && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              data-testid={`location-row-${index}-up`}
              onClick={onMoveUp}
              disabled={index === 0}
              aria-label={t('detail.locationsEditor.actions.moveUp')}
              className="rounded border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-2 py-1 text-sm hover:bg-[var(--color-muted)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              ↑
            </button>
            <button
              type="button"
              data-testid={`location-row-${index}-down`}
              onClick={onMoveDown}
              disabled={index === total - 1}
              aria-label={t('detail.locationsEditor.actions.moveDown')}
              className="rounded border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-2 py-1 text-sm hover:bg-[var(--color-muted)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              ↓
            </button>
            <button
              type="button"
              data-testid={`location-row-${index}-remove`}
              onClick={onRemove}
              aria-label={t('detail.locationsEditor.actions.remove')}
              className="rounded border border-[var(--color-destructive)] bg-[var(--color-surface-container-lowest)] px-2 py-1 text-sm text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10"
            >
              ✕
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`location-${index}-type`}
            className="mb-1 block text-sm font-semibold text-[var(--color-foreground)]"
          >
            {t('detail.locationsEditor.fields.type')} *
          </label>
          <select
            id={`location-${index}-type`}
            className={selectClass}
            value={row.type}
            disabled={disabled}
            onChange={(e) =>
              onChange('type', e.target.value as WeddingLocationType)
            }
          >
            {(
              [
                WeddingLocationType.CivilCeremony,
                WeddingLocationType.ReligiousCeremony,
                WeddingLocationType.Reception,
                WeddingLocationType.AfterParty,
                WeddingLocationType.NextDayBrunch,
                WeddingLocationType.Other,
              ] as WeddingLocationType[]
            ).map((opt) => (
              <option key={opt} value={opt}>
                {t(`detail.locationsEditor.typeOptions.${opt}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={`location-${index}-venueName`}
            className="mb-1 block text-sm font-semibold text-[var(--color-foreground)]"
          >
            {t('detail.locationsEditor.fields.venueName')} *
          </label>
          <input
            id={`location-${index}-venueName`}
            type="text"
            autoComplete="off"
            placeholder={t(
              'detail.locationsEditor.fields.venueNamePlaceholder',
            )}
            className={inputClass}
            value={row.venueName}
            disabled={disabled}
            maxLength={VENUE_MAX}
            onChange={(e) => onChange('venueName', e.target.value)}
          />
          {row.venueName.length > VENUE_MAX && (
            <p className="mt-1 text-xs text-[var(--color-destructive)]">
              {t('detail.locationsEditor.errors.maxLength')}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`location-${index}-eventDate`}
            className="mb-1 block text-sm font-semibold text-[var(--color-foreground)]"
          >
            {t('detail.locationsEditor.fields.eventDate')} *
          </label>
          <input
            id={`location-${index}-eventDate`}
            type="date"
            className={inputClass}
            value={row.eventDate}
            disabled={disabled}
            onChange={(e) => onChange('eventDate', e.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor={`location-${index}-startTime`}
            className="mb-1 block text-sm font-semibold text-[var(--color-foreground)]"
          >
            {t('detail.locationsEditor.fields.startTime')}
          </label>
          <input
            id={`location-${index}-startTime`}
            type="time"
            className={inputClass}
            value={row.startTime ?? ''}
            disabled={disabled}
            placeholder={t(
              'detail.locationsEditor.fields.startTimePlaceholder',
            )}
            onChange={(e) =>
              onChange(
                'startTime',
                e.target.value === '' ? null : e.target.value,
              )
            }
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor={`location-${index}-address`}
            className="mb-1 block text-sm font-semibold text-[var(--color-foreground)]"
          >
            {t('detail.locationsEditor.fields.address')} *
          </label>
          <input
            id={`location-${index}-address`}
            type="text"
            autoComplete="off"
            placeholder={t(
              'detail.locationsEditor.fields.addressPlaceholder',
            )}
            className={inputClass}
            value={row.address}
            disabled={disabled}
            maxLength={ADDRESS_MAX}
            onChange={(e) => onChange('address', e.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor={`location-${index}-city`}
            className="mb-1 block text-sm font-semibold text-[var(--color-foreground)]"
          >
            {t('detail.locationsEditor.fields.city')} *
          </label>
          <input
            id={`location-${index}-city`}
            type="text"
            autoComplete="off"
            placeholder={t('detail.locationsEditor.fields.cityPlaceholder')}
            className={inputClass}
            value={row.city}
            disabled={disabled}
            maxLength={CITY_MAX}
            onChange={(e) => onChange('city', e.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor={`location-${index}-mapLink`}
            className="mb-1 block text-sm font-semibold text-[var(--color-foreground)]"
          >
            {t('detail.locationsEditor.fields.mapLink')}
          </label>
          <input
            id={`location-${index}-mapLink`}
            type="url"
            autoComplete="off"
            placeholder={t('detail.locationsEditor.fields.mapLinkPlaceholder')}
            className={inputClass}
            value={row.googleMapsLink ?? ''}
            disabled={disabled}
            onChange={(e) => {
              const value = e.target.value;
              onChange(
                'googleMapsLink',
                value === '' ? null : value,
              );
            }}
          />
          {row.googleMapsLink &&
            row.googleMapsLink.length > 0 &&
            !/^https?:\/\//.test(row.googleMapsLink) && (
              <p className="mt-1 text-xs text-[var(--color-destructive)]">
                {t('detail.locationsEditor.errors.invalidUrl')}
              </p>
            )}
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor={`location-${index}-notes`}
            className="mb-1 block text-sm font-semibold text-[var(--color-foreground)]"
          >
            {t('detail.locationsEditor.fields.notes')}
          </label>
          <textarea
            id={`location-${index}-notes`}
            className={inputClass}
            rows={2}
            placeholder={t('detail.locationsEditor.fields.notesPlaceholder')}
            value={row.notes ?? ''}
            disabled={disabled}
            maxLength={NOTES_MAX}
            onChange={(e) => {
              const value = e.target.value;
              onChange('notes', value === '' ? null : value);
            }}
          />
        </div>
      </div>
    </article>
  );
}

// US-014a: status chip — mirrors the BasicInformationForm's chip
// pattern (saving / dirty / saved / error). The chip is a button
// only when there is something actionable (dirty → save, error →
// retry); the rest of the time it is read-only.
function StatusChip({
  state,
  canSave,
  pipLabel,
  onSave,
}: {
  state: SaveState;
  canSave: boolean;
  pipLabel: string;
  onSave: () => void;
}): React.ReactElement {
  const baseClass =
    'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] transition-colors';
  const toneClass =
    state === 'saved' || state === 'pristine'
      ? 'bg-[var(--color-status-confirmed-bg)] text-[var(--color-status-confirmed-text)]'
      : state === 'dirty'
        ? 'bg-[var(--color-tertiary-fixed)] text-[var(--color-on-tertiary-fixed-variant)] cursor-pointer hover:brightness-95'
        : state === 'saving'
          ? 'bg-[var(--color-surface-container-high)] text-[var(--color-secondary)] cursor-wait'
          : 'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] cursor-pointer hover:brightness-95';

  if (state === 'pristine' || state === 'saving' || state === 'saved') {
    return (
      <span
        data-testid="wedding-data-locations-chip"
        data-state={state}
        className={`${baseClass} ${toneClass}`}
      >
        {pipLabel}
      </span>
    );
  }

  return (
    <button
      type="button"
      data-testid="wedding-data-locations-chip"
      data-state={state}
      onClick={onSave}
      disabled={!canSave}
      className={`${baseClass} ${toneClass} border-0 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {pipLabel}
    </button>
  );
}