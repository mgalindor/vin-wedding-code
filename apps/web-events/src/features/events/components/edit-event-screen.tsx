import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useEventsService, type UpdateEventRequest } from '@/features/events/events.service';
import { Button, ErrorBanner, FieldShell, Input, Select, Spinner } from '@/shared/ui';

interface FormState extends UpdateEventRequest {}

export function EditEventScreen(): React.ReactElement {
  const params = useParams({ strict: false }) as { eventId?: string };
  const navigate = useNavigate();
  const { t } = useTranslation(['events', 'common']);
  const service = useEventsService();
  const eventId = params.eventId ?? '';

  const event = useQuery({
    queryKey: ['events', 'detail', eventId],
    queryFn: () => service.getEvent(eventId),
    enabled: Boolean(eventId),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<FormState>({
    mode: 'onSubmit',
    defaultValues: { title: '', eventDate: '' },
  });

  // Hydrate when the event arrives. The edit endpoint accepts the two
  // partial-update fields (title, eventDate); eventType is read-only
  // here on purpose (changing the type is a destructive operation that
  // invalidates the wedding-detail row).
  useEffect(() => {
    if (event.data) {
      reset({
        title: event.data.title,
        eventDate: event.data.eventDate,
      });
    }
  }, [event.data, reset]);

  if (event.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!event.data) return <></>;

  const onSubmit = async (dto: FormState) => {
    try {
      await service.updateEvent(eventId, {
        title: dto.title?.trim() || undefined,
        eventDate: dto.eventDate || undefined,
      });
      void navigate({ to: '/dashboard/events/$eventId', params: { eventId } });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not save');
    }
  };

  const watchedDate = watch('eventDate');

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <Link
        to="/dashboard/events/$eventId"
        params={{ eventId }}
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-secondary)] no-underline hover:text-[var(--color-primary)]"
      >
        <ArrowLeft className="h-3 w-3" /> {t('common:actions.back')}
      </Link>

      <header className="mb-8">
        <h1
          className="text-3xl font-bold tracking-tight text-[var(--color-on-surface)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('events:edit.title')}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-secondary)]">
          {t('events:edit.subtitle')}
        </p>
      </header>

      <form
        className="space-y-6 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-8 shadow-[var(--shadow-card)]"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <FieldShell
          label={t('events:new.fields.title')}
          htmlFor="title"
          required
          error={errors.title?.message}
        >
          <Input
            id="title"
            {...register('title', {
              required: t('events:new.errors.title'),
              maxLength: { value: 180, message: 'Too long' },
            })}
          />
        </FieldShell>

        <FieldShell
          label={t('events:new.fields.eventType')}
          htmlFor="eventType"
          hint="The event type is read-only here — change it later by archiving and recreating if absolutely necessary."
        >
          <Select
            id="eventType"
            disabled
            defaultValue={event.data.eventType}
          >
            <option value="wedding">{t('events:eventType.wedding')}</option>
            <option value="birthday">{t('events:eventType.birthday')}</option>
            <option value="anniversary">{t('events:eventType.anniversary')}</option>
            <option value="corporate">{t('events:eventType.corporate')}</option>
            <option value="other">{t('events:eventType.other')}</option>
          </Select>
        </FieldShell>

        <FieldShell
          label={t('events:new.fields.eventDate')}
          htmlFor="eventDate"
          required
          error={errors.eventDate?.message}
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
                return new Date(y, m - 1, d).getTime() >= today.getTime() || 'Past dates are kept';
              },
            })}
          />
        </FieldShell>

        <div className="rounded-md border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-4 text-xs text-[var(--color-secondary)]">
          {t('events:statuses.title')}: {t(`events:status.${event.data.status}`)}
          <p className="mt-1">
            {event.data.status === 'draft' && t('events:statuses.draftDescription')}
            {event.data.status === 'published' && t('events:statuses.publishedDescription')}
            {event.data.status === 'archived' && t('events:statuses.archivedDescription')}
          </p>
        </div>

        {Object.keys(errors).length > 0 && (
          <ErrorBanner>
            {Object.values(errors).map((e) => e?.message).filter(Boolean).join(' · ')}
          </ErrorBanner>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !watchedDate}>
            <Save className="h-4 w-4" /> {isSubmitting ? t('common:actions.saving') : t('events:edit.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
