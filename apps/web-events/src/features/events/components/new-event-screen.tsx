import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useEventsService, type CreateEventRequest, type EventType } from '@/features/events/events.service';
import { Button, ErrorBanner, FieldShell, Input, Label, Select } from '@/shared/ui';

interface FormState extends CreateEventRequest {}

const EVENT_TYPE_OPTIONS: ReadonlyArray<{ value: EventType; labelKey: string; hint: string }> = [
  { value: 'wedding', labelKey: 'events:eventType.wedding', hint: 'Couple, story, dress code…' },
  { value: 'birthday', labelKey: 'events:eventType.birthday', hint: 'Honoree, age, theme…' },
  { value: 'anniversary', labelKey: 'events:eventType.anniversary', hint: 'Years together, milestones…' },
  { value: 'corporate', labelKey: 'events:eventType.corporate', hint: 'Agenda, venue, sponsors…' },
  { value: 'other', labelKey: 'events:eventType.other', hint: 'Anything else' },
];

export function NewEventScreen(): React.ReactElement {
  const navigate = useNavigate();
  const { t } = useTranslation(['events', 'common']);
  const service = useEventsService();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<FormState>({
    mode: 'onSubmit',
    defaultValues: { eventType: 'wedding', title: '', eventDate: '' },
  });

  const watched = watch();
  const isValidForReview = useMemo(
    () => Boolean(watched.title && watched.eventType && watched.eventDate),
    [watched],
  );

  const goNext = () => setStep((s) => Math.min(2, s + 1) as 0 | 1 | 2);
  const goBack = () => setStep((s) => Math.max(0, s - 1) as 0 | 1 | 2);

  const onSubmit = async (dto: FormState) => {
    setSubmitting(true);
    setError(null);
    try {
      const created = await service.createEvent({
        title: dto.title.trim(),
        eventType: dto.eventType,
        eventDate: dto.eventDate,
      });
      void navigate({
        to: '/dashboard/events/$eventId',
        params: { eventId: created.id },
        replace: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      {/* Back link */}
      <button
        type="button"
        onClick={() => {
          if (step === 0) {
            void navigate({ to: '/dashboard' });
          } else {
            goBack();
          }
        }}
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
      >
        <ArrowLeft className="h-3 w-3" /> {t('common:actions.back')}
      </button>

      <header className="mb-8">
        <h1
          className="text-3xl font-bold tracking-tight text-[var(--color-on-surface)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('events:new.title')}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-secondary)]">
          {t('events:new.subtitle')}
        </p>
      </header>

      {/* Stepper */}
      <Stepper currentStep={step} />

      <form
        className="rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-8 shadow-[var(--shadow-card)]"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        {/* Step 0 — type */}
        {step === 0 && (
          <div>
            <h2 className="mb-4 text-base font-semibold text-[var(--color-on-surface)]">
              {t('events:new.step.type')}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={
                    'flex cursor-pointer flex-col gap-1 rounded-lg border p-4 transition-colors ' +
                    (watched.eventType === opt.value
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-fixed)]/30'
                      : 'border-[var(--color-outline-variant)] hover:border-[var(--color-primary-container)]')
                  }
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="radio"
                      value={opt.value}
                      className="sr-only"
                      checked={watched.eventType === opt.value}
                      onChange={() => setValue('eventType', opt.value)}
                    />
                    <span className="text-sm font-semibold text-[var(--color-on-surface)]">
                      {t(opt.labelKey)}
                    </span>
                    {watched.eventType === opt.value && (
                      <Check className="h-4 w-4 text-[var(--color-primary)]" />
                    )}
                  </div>
                  <span className="text-xs text-[var(--color-secondary)]">{opt.hint}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 1 — title */}
        {step === 1 && (
          <div>
            <h2 className="mb-4 text-base font-semibold text-[var(--color-on-surface)]">
              {t('events:new.step.details')}
            </h2>
            <FieldShell
              label={t('events:new.fields.title')}
              htmlFor="title"
              required
              error={errors.title?.message}
            >
              <Input
                id="title"
                placeholder={t('events:new.fields.titlePlaceholder')}
                {...register('title', {
                  required: t('events:new.errors.title'),
                  maxLength: { value: 180, message: 'Too long' },
                })}
              />
            </FieldShell>
          </div>
        )}

        {/* Step 2 — date + review */}
        {step === 2 && (
          <div>
            <h2 className="mb-4 text-base font-semibold text-[var(--color-on-surface)]">
              {t('events:new.step.when')}
            </h2>
            <FieldShell
              label={t('events:new.fields.eventDate')}
              htmlFor="eventDate"
              required
              error={errors.eventDate?.message}
              hint={t('events:new.errors.future')}
            >
              <Input
                id="eventDate"
                type="date"
                {...register('eventDate', {
                  required: t('events:new.errors.date'),
                  validate: (v) => {
                    if (!v) return true;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const [y, m, d] = v.split('-').map(Number);
                    if (!y || !m || !d) return true;
                    const chosen = new Date(y, m - 1, d);
                    return chosen.getTime() >= today.getTime() || t('events:new.errors.future');
                  },
                })}
              />
            </FieldShell>

            <div className="mt-6 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-5">
              <Label>{t('events:new.preview.label')}</Label>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-[var(--color-secondary)]">
                    {t('events:new.fields.eventType')}
                  </dt>
                  <dd className="font-medium">
                    {t(`events:eventType.${watched.eventType}`, { defaultValue: watched.eventType })}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-[var(--color-secondary)]">
                    {t('events:new.fields.title')}
                  </dt>
                  <dd className="truncate font-medium">{watched.title || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-[var(--color-secondary)]">
                    {t('events:new.fields.eventDate')}
                  </dt>
                  <dd className="font-medium">{watched.eventDate || '—'}</dd>
                </div>
              </dl>
            </div>

            {error && (
              <div className="mt-4">
                <ErrorBanner>{error}</ErrorBanner>
              </div>
            )}
          </div>
        )}

        {/* Footer nav */}
        <footer className="mt-8 flex items-center justify-between gap-3 border-t border-[var(--color-outline-variant)] pt-6">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={goBack}>
              {t('common:actions.previous')}
            </Button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <Button
              type="button"
              onClick={goNext}
              disabled={
                (step === 0 && !watched.eventType) ||
                (step === 1 && !watched.title.trim())
              }
              data-testid="wizard-next"
            >
              {t('common:actions.next')} <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={submitting || !isValidForReview}
              data-testid="wizard-submit"
            >
              {submitting ? t('common:actions.saving') : t('events:new.preview.tail')}
            </Button>
          )}
        </footer>
      </form>
    </div>
  );
}

function Stepper({ currentStep }: { currentStep: 0 | 1 | 2 }) {
  const { t } = useTranslation('events');
  const steps: Array<{ key: 'type' | 'details' | 'when'; labelKey: string }> = [
    { key: 'type', labelKey: 'new.step.type' },
    { key: 'details', labelKey: 'new.step.details' },
    { key: 'when', labelKey: 'new.step.when' },
  ];

  return (
    <ol className="mb-6 flex items-center gap-3 text-xs">
      {steps.map((step, i) => {
        const active = i === currentStep;
        const done = i < currentStep;
        return (
          <li key={step.key} className="flex items-center gap-3">
            <span
              className={
                'flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold ' +
                (done
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                  : active
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-[var(--color-outline-variant)] text-[var(--color-secondary)]')
              }
            >
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span
              className={
                'uppercase tracking-wider ' +
                (active ? 'font-semibold text-[var(--color-on-surface)]' : 'text-[var(--color-secondary)]')
              }
            >
              {t(step.labelKey)}
            </span>
            {i < steps.length - 1 && (
              <span className="mx-2 h-px w-8 bg-[var(--color-outline-variant)]" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
