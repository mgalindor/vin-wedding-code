import { useParams } from '@tanstack/react-router';
import { type UpdateWeddingDto, type WeddingDto } from '@wendy/contracts';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useWeddingsService } from '../weddings.service';
import { useWeddingForTab } from '../hooks/use-wedding-for-tab';

import { DetailScreenShell } from './detail-screen-shell';
import { WeddingDetailLayout } from './wedding-detail-layout';

/**
 * Wedding Data tab.
 *
 * Renders the basic-information card as an inline edit form, matching
 * the mockup surface (`05-wedding-detail.html`, tab "Wedding Data"):
 *
 *   - On mount the form is pre-populated from the GET response.
 *   - The status chip in the card header is reactive:
 *       • `✓ Complete` (green / `pip-complete`) — when the form is
 *         pristine (no edits since the last save).
 *       • `Save Changes` (yellow / `pip-progress`) — as soon as any
 *         field diverges from the saved snapshot. The chip is now a
 *         button: clicking it persists the PATCH and flips back to
 *         `✓ Saved` (briefly) → `✓ Complete`.
 *       • `Saving…` while the request is in flight (chip disabled).
 *       • `Save failed — try again` if the PATCH errors (chip turns
 *         red / destructive; clicking it retries).
 *
 * The 5 basic-information fields are owned by the Wedding bounded
 * context (US-009/010). Ceremony start time is shown in the form
 * (mockup parity) but is NOT yet persisted — US-022 will add it to
 * the Wedding payload.
 */

type SaveState = 'pristine' | 'dirty' | 'saving' | 'saved' | 'error';

const PARTNER_NAME_MAX = 120;
const VENUE_NAME_MAX = 120;
const VENUE_CITY_MAX = 120;

interface FormShape {
  partner1Name: string;
  partner2Name: string;
  eventDate: string;
  // Ceremony start time as HH:mm, optional on the wire (null when
  // unset). The form keeps an empty string as the working value so
  // the `<input type="time">` stays controlled.
  startTime: string;
  venueName: string;
  venueCity: string;
}

const inputClass =
  'w-full rounded border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-secondary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/40 disabled:opacity-60';

function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isPastDate(value: string): boolean {
  if (!value) return false;
  return value < todayIso();
}

function snapshot(dto: WeddingDto): FormShape {
  return {
    partner1Name: dto.partner1Name,
    partner2Name: dto.partner2Name,
    eventDate: dto.eventDate,
    // Empty string when unset so the controlled input stays blank.
    startTime: dto.startTime ?? '',
    venueName: dto.venueName,
    venueCity: dto.venueCity,
  };
}

function shapeEqual(a: FormShape, b: FormShape): boolean {
  return (
    a.partner1Name === b.partner1Name &&
    a.partner2Name === b.partner2Name &&
    a.eventDate === b.eventDate &&
    a.startTime === b.startTime &&
    a.venueName === b.venueName &&
    a.venueCity === b.venueCity
  );
}

export function WeddingDataScreen(): React.ReactElement {
  const { t } = useTranslation('weddings');
  const params = useParams({ strict: false }) as { weddingId?: string };
  const weddingId = params.weddingId ?? '';
  const service = useWeddingsService();
  const { wedding, loadError } = useWeddingForTab(weddingId);

  return (
    <DetailScreenShell
      wedding={wedding}
      loadError={loadError}
      loadingLabel={t('detailPlaceholder.loading')}
    >
      {(w) => (
        <WeddingDetailLayout wedding={w} activeTab="data">
          <div className="space-y-6 px-10 py-8">
            <BasicInformationForm
              wedding={w}
              service={service}
              weddingId={weddingId}
            />

            <PlaceholderSection
              testId="wedding-data-locations"
              title={t('detail.data.locations')}
              subtitle={t('detail.data.locationsSubtitle')}
              comingIn={t('detail.data.locationsComingIn')}
            />

            <PlaceholderSection
              testId="wedding-data-program"
              title={t('detail.data.eventProgram')}
              subtitle={t('detail.data.eventProgramSubtitle')}
              comingIn={t('detail.data.eventProgramComingIn')}
            />

            <PlaceholderSection
              testId="wedding-data-contacts"
              title={t('detail.data.contacts')}
              subtitle={t('detail.data.contactsSubtitle')}
              comingIn={t('detail.data.contactsComingIn')}
            />
          </div>
        </WeddingDetailLayout>
      )}
    </DetailScreenShell>
  );
}

function BasicInformationForm({
  wedding,
  service,
  weddingId,
}: {
  wedding: WeddingDto;
  service: ReturnType<typeof useWeddingsService>;
  weddingId: string;
}): React.ReactElement {
  const { t } = useTranslation('weddings');
  // Compute the initial snapshot once per wedding. We intentionally
  // do NOT depend on `wedding` reactively — `useWeddingForTab`
  // refetches on every render (its useEffect depends on `t`, which
  // is a fresh function each render), so any reactive computation
  // here would thrash and reset the form state mid-edit.
  const initialRef = useRef<FormShape | null>(null);
  if (initialRef.current === null) {
    initialRef.current = snapshot(wedding);
  }
  const initial = initialRef.current;

  const [savedSnapshot, setSavedSnapshot] = useState<FormShape>(initial);
  const [saveState, setSaveState] = useState<SaveState>('pristine');
  const [pastDateAck, setPastDateAck] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    reset,
    trigger,
    formState: { errors, isValid },
  } = useForm<FormShape>({
    mode: 'onChange',
    defaultValues: initial,
  });

  const values = watch();

  // When a successful save returns, we explicitly reseed via the
  // success branch of `persist` (using the new server snapshot).
  // No reactive effect here on `initial` — it would thrash on every
  // render because `initial` is a fresh snapshot object each render.
  // See the useRef above for why we capture once.

  // Dirty tracking — compare current values to the last saved snapshot
  // (ceremonyTime is display-only, so we ignore it).
  const isDirty = !shapeEqual(values, savedSnapshot);

  // Past-date acknowledgement (mirrors NewWeddingForm's Rule 7 logic
  // — required for the save action to be enabled).
  const eventDate = watch('eventDate');
  const isPast = isPastDate(eventDate);
  const showPastWarning = isPast && eventDate !== '';
  useEffect(() => {
    setPastDateAck(false);
  }, [eventDate]);

  // Flip state machine as the user types.
  useEffect(() => {
    if (saveState === 'saving') return; // Don't override in-flight.
    if (saveState === 'error') return; // Keep the error chip until retry.
    if (isDirty) {
      setSaveState('dirty');
    } else if (saveState === 'saved' && !savedFlash) {
      // Stay on "saved" briefly after a save to acknowledge.
      setSaveState('pristine');
    }
  }, [isDirty, saveState, savedFlash]);

  // Persist is the single source of truth for the PATCH path. Both
  // the form submit and the chip onClick route through it. The chip
  // path calls `getValues()` + `trigger()` directly to bypass the
  // handleSubmit pipeline (which we found unreliable when invoked
  // outside a native form submit context).
  const persist = async (dto: FormShape): Promise<void> => {
    setServerError(null);
    setSaveState('saving');
    try {
      const payload: UpdateWeddingDto = {
        partner1Name: dto.partner1Name.trim(),
        partner2Name: dto.partner2Name.trim(),
        eventDate: dto.eventDate,
        // Empty input → null on the wire (the BE normalises both to
        // null so the countdown banner can show its 18:00 fallback).
        startTime: dto.startTime.trim() === '' ? null : dto.startTime,
        venueName: dto.venueName.trim(),
        venueCity: dto.venueCity.trim(),
      };
      const updated = await service.updateWedding(weddingId, payload);
      const next = snapshot(updated);
      reset(next);
      setSavedSnapshot(next);
      setSaveState('saved');
      setSavedFlash(true);
      // Brief confirmation then revert to the calm "Complete" state.
      window.setTimeout(() => {
        setSavedFlash(false);
        setSaveState('pristine');
      }, 1800);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : t('detail.data.errors.saveFailed'),
      );
      setSaveState('error');
    }
  };

  // Native form submit (Enter key on any field).
  const onFormSubmit = handleSubmit(async (dto) => {
    await persist(dto);
  });

  // Chip click path — bypass handleSubmit (which only fires from a
  // native submit event) and pull the current values + trigger
  // validation manually. This is the path the Save Changes chip
  // button takes when the user explicitly clicks the chip.
  const onChipSave = async (): Promise<void> => {
    const valid = await trigger();
    if (!valid) return;
    const dto = getValues();
    await persist(dto);
  };

  const canSave =
    // Avoid gating `isValid` — RHF's isValid only flips to true after
    // a validate pass, which can lag behind a fresh `fireEvent.change`
    // in jsdom. The actual validation gate is the explicit
    // `trigger()` call inside `onChipSave`, so the button is enabled
    // whenever the form is interactive (not in-flight, past-date OK).
    saveState !== 'saving' &&
    (!showPastWarning || pastDateAck);

  const fieldError = (field: keyof FormShape): string | undefined => {
    const local = (errors as Record<string, { message?: string } | undefined>)[
      field
    ]?.message;
    if (local) return local;
    return undefined;
  };

  const chipState: SaveState = saveState;

  return (
    <section
      data-testid="wedding-data-basics"
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-8 py-7"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-secondary)]">
          {t('detail.data.basicInformation')}
        </h2>
        <StatusChip
          state={chipState}
          canSave={canSave}
          serverError={serverError}
          onSave={onChipSave}
          t={t}
        />
      </div>

      <form onSubmit={onFormSubmit} className="space-y-5" noValidate>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="partner1Name"
              className="mb-1 block text-sm font-semibold text-[var(--color-foreground)]"
            >
              {t('detail.data.partner1')} *
            </label>
            <input
              id="partner1Name"
              type="text"
              autoComplete="off"
              placeholder={t('detail.data.fields.partner1Placeholder')}
              className={inputClass}
              {...register('partner1Name', {
                required: t('detail.data.errors.required'),
                maxLength: {
                  value: PARTNER_NAME_MAX,
                  message: t('detail.data.errors.tooLong'),
                },
              })}
            />
            {fieldError('partner1Name') && (
              <p className="mt-1 text-xs text-[var(--color-destructive)]">
                {fieldError('partner1Name')}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="partner2Name"
              className="mb-1 block text-sm font-semibold text-[var(--color-foreground)]"
            >
              {t('detail.data.partner2')} *
            </label>
            <input
              id="partner2Name"
              type="text"
              autoComplete="off"
              placeholder={t('detail.data.fields.partner2Placeholder')}
              className={inputClass}
              {...register('partner2Name', {
                required: t('detail.data.errors.required'),
                maxLength: {
                  value: PARTNER_NAME_MAX,
                  message: t('detail.data.errors.tooLong'),
                },
              })}
            />
            {fieldError('partner2Name') && (
              <p className="mt-1 text-xs text-[var(--color-destructive)]">
                {fieldError('partner2Name')}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="eventDate"
              className="mb-1 block text-sm font-semibold text-[var(--color-foreground)]"
            >
              {t('detail.data.eventDate')} *
            </label>
            <input
              id="eventDate"
              type="date"
              className={inputClass}
              {...register('eventDate', {
                required: t('detail.data.errors.required'),
              })}
            />
            {fieldError('eventDate') && (
              <p className="mt-1 text-xs text-[var(--color-destructive)]">
                {fieldError('eventDate')}
              </p>
            )}
            {showPastWarning && (
              <div
                role="status"
                aria-live="polite"
                className="mt-2 flex items-center gap-3 rounded border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              >
                <span className="flex-1">
                  {t('create.warnings.pastDate')}
                </span>
                {!pastDateAck && (
                  <button
                    type="button"
                    className="rounded border border-amber-500 px-3 py-1 text-xs font-semibold uppercase tracking-[0.05em] text-amber-900 hover:bg-amber-100"
                    onClick={() => setPastDateAck(true)}
                  >
                    {t('create.warnings.pastDateAcknowledge')}
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="startTime"
              className="mb-1 block text-sm font-semibold text-[var(--color-foreground)]"
            >
              {t('detail.data.fields.ceremonyTimeLabel')}
            </label>
            <input
              id="startTime"
              type="time"
              className={inputClass}
              {...register('startTime')}
            />
          </div>

          <div>
            <label
              htmlFor="venueName"
              className="mb-1 block text-sm font-semibold text-[var(--color-foreground)]"
            >
              {t('detail.data.venueName')} *
            </label>
            <input
              id="venueName"
              type="text"
              autoComplete="off"
              placeholder={t('detail.data.fields.venuePlaceholder')}
              className={inputClass}
              {...register('venueName', {
                required: t('detail.data.errors.required'),
                maxLength: {
                  value: VENUE_NAME_MAX,
                  message: t('detail.data.errors.tooLong'),
                },
              })}
            />
            {fieldError('venueName') && (
              <p className="mt-1 text-xs text-[var(--color-destructive)]">
                {fieldError('venueName')}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="venueCity"
              className="mb-1 block text-sm font-semibold text-[var(--color-foreground)]"
            >
              {t('detail.data.venueCity')} *
            </label>
            <input
              id="venueCity"
              type="text"
              autoComplete="off"
              placeholder={t('detail.data.fields.venueCityPlaceholder')}
              className={inputClass}
              {...register('venueCity', {
                required: t('detail.data.errors.required'),
                maxLength: {
                  value: VENUE_CITY_MAX,
                  message: t('detail.data.errors.tooLong'),
                },
              })}
            />
            {fieldError('venueCity') && (
              <p className="mt-1 text-xs text-[var(--color-destructive)]">
                {fieldError('venueCity')}
              </p>
            )}
          </div>
        </div>

        {serverError && (
          <div
            role="alert"
            className="rounded border-l-4 border-[var(--color-destructive)] bg-[var(--color-muted)] px-4 py-3 text-sm text-[var(--color-foreground)]"
          >
            {serverError}
          </div>
        )}
      </form>
    </section>
  );
}

function StatusChip({
  state,
  canSave,
  onSave,
  serverError,
  t,
}: {
  state: SaveState;
  canSave: boolean;
  onSave: () => void;
  serverError: string | null;
  t: (key: string) => string;
}): React.ReactElement {
  // Pill background + text color match the mockup's pip variants:
  //   - pip-complete → green (status-confirmed) for "✓ Complete" / "✓ Saved"
  //   - pip-save     → tertiary blue (tertiary-fixed) for "Save changes"
  //   - pip-empty    → gray for "Saving…"
  //   - destructive  → red for the save-error state
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
  const label =
    state === 'pristine'
      ? t('detail.data.chip.complete')
      : state === 'dirty'
        ? t('detail.data.chip.dirty')
        : state === 'saving'
          ? t('detail.data.chip.saving')
          : state === 'saved'
            ? t('detail.data.chip.saved')
            : serverError ?? t('detail.data.chip.saveError');

  // The chip is a button only when there is something actionable
  // (dirty → save, error → retry). "Complete" / "Saving…" are read.
  if (state === 'pristine' || state === 'saving' || state === 'saved') {
    return (
      <span
        data-testid="wedding-data-basics-chip"
        data-state={state}
        className={`${baseClass} ${toneClass}`}
      >
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      data-testid="wedding-data-basics-chip"
      data-state={state}
      onClick={onSave}
      disabled={!canSave}
      className={`${baseClass} ${toneClass} border-0 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );
}

function PlaceholderSection({
  testId,
  title,
  subtitle,
  comingIn,
}: {
  testId: string;
  title: string;
  subtitle: string;
  comingIn: string;
}): React.ReactElement {
  return (
    <section
      data-testid={testId}
      className="rounded-xl border border-dashed border-[var(--color-outline-variant)] bg-[var(--color-muted)] px-8 py-7"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-secondary)]">
          {title}
        </h2>
        <span className="inline-flex items-center rounded-full border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--color-secondary)]">
          {comingIn}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--color-secondary)]">
        {subtitle}
      </p>
    </section>
  );
}
