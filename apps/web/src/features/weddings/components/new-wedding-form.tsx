import { type CreateWeddingDto } from '@wendy/contracts';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui/button';

interface NewWeddingFormProps {
  isSubmitting: boolean;
  serverError?: { field?: string; message: string } | null;
  onSubmit: (dto: CreateWeddingDto) => void | Promise<void>;
  onCancel: () => void;
}

const PARTNER_NAME_MAX = 120;
const VENUE_NAME_MAX = 120;
const VENUE_CITY_MAX = 120;

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

const inputClass =
  'w-full rounded border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-secondary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/40 disabled:opacity-60';

/**
 * New Wedding form (US-009).
 *
 * Captures five required fields: Partner 1, Partner 2, Wedding Date,
 * Venue Name, City. The form does NOT capture a ceremony time (per
 * functional-spec v1.2.0) and does NOT render an invitation template
 * picker (per functional-spec v1.1.0).
 *
 * The past-date warning is a presentation concern — Rule 7 — and
 * appears inline beneath the date field when the typed date is before
 * today. The user must acknowledge before the save action is enabled.
 *
 * All five fields share the same max-length rules as the BE DTO
 * (single source of truth via `class-validator` decorators on
 * `CreateWeddingDto`).
 */
export function NewWeddingForm({
  isSubmitting,
  serverError,
  onSubmit,
  onCancel,
}: NewWeddingFormProps): React.ReactElement {
  const { t } = useTranslation('weddings');
  const [pastDateAck, setPastDateAck] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<CreateWeddingDto>({
    mode: 'onChange',
    defaultValues: {
      partner1Name: '',
      partner2Name: '',
      eventDate: '',
      venueName: '',
      venueCity: '',
    },
  });

  const eventDate = watch('eventDate');
  const isPast = useMemo(() => isPastDate(eventDate), [eventDate]);

  // Reset acknowledgement whenever the date changes so a fresh past
  // date requires a fresh confirmation (Rule 7).
  useEffect(() => {
    setPastDateAck(false);
  }, [eventDate]);

  const partner1Name = watch('partner1Name');
  const partner2Name = watch('partner2Name');
  const venueName = watch('venueName');
  const venueCity = watch('venueCity');

  const showPastWarning = isPast && eventDate !== '';
  const canSubmit =
    isValid &&
    !isSubmitting &&
    (!showPastWarning || pastDateAck) &&
    partner1Name.trim().length > 0 &&
    partner2Name.trim().length > 0 &&
    venueName.trim().length > 0 &&
    venueCity.trim().length > 0;

  const submit = handleSubmit(async (dto) => {
    await onSubmit({
      ...dto,
      partner1Name: dto.partner1Name.trim(),
      partner2Name: dto.partner2Name.trim(),
      venueName: dto.venueName.trim(),
      venueCity: dto.venueCity.trim(),
    });
  });

  const fieldError = (field: keyof CreateWeddingDto): string | undefined => {
    const local = (errors as Record<string, { message?: string } | undefined>)[
      field
    ]?.message;
    if (local) return local;
    if (serverError?.field === field) return serverError.message;
    return undefined;
  };

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <fieldset className="space-y-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-8">
        <legend className="px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-secondary)]">
          {t('create.sections.couple')}
        </legend>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="partner1Name"
              className="mb-1 block text-sm font-semibold text-[var(--color-foreground)]"
            >
              {t('create.fields.partner1Name')} *
            </label>
            <input
              id="partner1Name"
              type="text"
              autoComplete="off"
              disabled={isSubmitting}
              placeholder={t('create.fields.partner1Placeholder')}
              className={inputClass}
              {...register('partner1Name', {
                required: t('create.errors.required'),
                maxLength: {
                  value: PARTNER_NAME_MAX,
                  message: t('create.errors.tooLong'),
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
              {t('create.fields.partner2Name')} *
            </label>
            <input
              id="partner2Name"
              type="text"
              autoComplete="off"
              disabled={isSubmitting}
              placeholder={t('create.fields.partner2Placeholder')}
              className={inputClass}
              {...register('partner2Name', {
                required: t('create.errors.required'),
                maxLength: {
                  value: PARTNER_NAME_MAX,
                  message: t('create.errors.tooLong'),
                },
              })}
            />
            {fieldError('partner2Name') && (
              <p className="mt-1 text-xs text-[var(--color-destructive)]">
                {fieldError('partner2Name')}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-8">
        <legend className="px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-secondary)]">
          {t('create.sections.venue')}
        </legend>
        <div>
          <label
            htmlFor="eventDate"
            className="mb-1 block text-sm font-semibold text-[var(--color-foreground)]"
          >
            {t('create.fields.eventDate')} *
          </label>
          <input
            id="eventDate"
            type="date"
            disabled={isSubmitting}
            className={inputClass}
            {...register('eventDate', {
              required: t('create.errors.required'),
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
              <span className="flex-1">{t('create.warnings.pastDate')}</span>
              {!pastDateAck && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setPastDateAck(true)}
                  aria-label={t('create.warnings.pastDateAcknowledge')}
                >
                  {t('create.warnings.pastDateAcknowledge')}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="venueName"
              className="mb-1 block text-sm font-semibold text-[var(--color-foreground)]"
            >
              {t('create.fields.venueName')} *
            </label>
            <input
              id="venueName"
              type="text"
              autoComplete="off"
              disabled={isSubmitting}
              placeholder={t('create.fields.venuePlaceholder')}
              className={inputClass}
              {...register('venueName', {
                required: t('create.errors.required'),
                maxLength: {
                  value: VENUE_NAME_MAX,
                  message: t('create.errors.tooLong'),
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
              {t('create.fields.venueCity')} *
            </label>
            <input
              id="venueCity"
              type="text"
              autoComplete="off"
              disabled={isSubmitting}
              placeholder={t('create.fields.venueCityPlaceholder')}
              className={inputClass}
              {...register('venueCity', {
                required: t('create.errors.required'),
                maxLength: {
                  value: VENUE_CITY_MAX,
                  message: t('create.errors.tooLong'),
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
      </fieldset>

      {serverError && !serverError.field && (
        <div
          role="alert"
          className="rounded border-l-4 border-[var(--color-destructive)] bg-[var(--color-muted)] px-4 py-3 text-sm text-[var(--color-foreground)]"
        >
          {serverError.message}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] pt-6">
        <Button
          type="button"
          variant="ghost"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          {t('create.actions.cancel')}
        </Button>
        <Button type="submit" variant="default" disabled={!canSubmit}>
          {isSubmitting
            ? t('create.actions.submitting')
            : t('create.actions.save')}
        </Button>
      </div>
    </form>
  );
}