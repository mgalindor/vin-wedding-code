import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useEventsService, type EventDto } from '@/features/events/events.service';
import { Button, Card, CardContent, CardHeader, CardTitle, FieldShell, Input, Label, Spinner, Textarea } from '@/shared/ui';

interface ProgramFormState {
  items: Array<{ time: string; title: string; description?: string }>;
}

const EMPTY_ITEM = { time: '', title: '', description: '' };

export function EventProgramScreen(): React.ReactElement {
  const { t } = useTranslation(['events', 'common']);
  const params = useParams({ strict: false }) as { eventId?: string };
  const eventId = params.eventId ?? '';
  const service = useEventsService();
  const navigate = useNavigate();

  const detail = useQuery({
    queryKey: ['events', 'detail', eventId],
    queryFn: () => service.getEvent(eventId),
    enabled: Boolean(eventId),
  });

  const { control, register, handleSubmit, reset, formState: { errors, isDirty, isSubmitting } } =
    useForm<ProgramFormState>({
      mode: 'onSubmit',
      defaultValues: { items: [EMPTY_ITEM] },
    });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (detail.data) {
      const items = detail.data.program?.items ?? [];
      reset({
        items:
          items.length > 0
            ? items.map((it) => ({ time: it.time, title: it.title, description: it.description ?? '' }))
            : [EMPTY_ITEM],
      });
    }
  }, [detail.data, reset]);

  if (detail.isLoading || !detail.data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const onSubmit = async (state: ProgramFormState) => {
    try {
      await service.putProgram(eventId, {
        items: state.items
          .filter((it) => it.time && it.title)
          .map((it) => ({
            time: it.time,
            title: it.title.trim(),
            description: it.description || undefined,
          })),
      });
      navigate({ to: '/dashboard/events/$eventId', params: { eventId } });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not save');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto w-full max-w-3xl space-y-6 px-8 py-8"
      data-testid="event-program"
    >
      <Header event={detail.data} />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t('events:detail.program.title')}</CardTitle>
            <p className="text-xs text-[var(--color-secondary)]">{t('events:detail.program.subtitle')}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.length === 0 && (
            <p className="rounded-md border border-dashed border-[var(--color-outline-variant)] p-6 text-center text-sm text-[var(--color-secondary)]">
              {t('events:detail.program.empty')}
            </p>
          )}

          {fields.map((field, i) => (
            <div
              key={field.id}
              className="rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <Label className="mb-0">
                  Item {i + 1}
                </Label>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-secondary)] hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)]"
                  aria-label={t('common:actions.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <FieldShell label={t('events:detail.program.fields.time')} required>
                  <Input type="time" {...register(`items.${i}.time` as const, { required: true })} />
                </FieldShell>
                <FieldShell label={t('events:detail.program.fields.title')} required className="md:col-span-3" error={errors.items?.[i]?.title?.message}>
                  <Input {...register(`items.${i}.title` as const, { required: 'Required' })} />
                </FieldShell>
                <FieldShell label={t('events:detail.program.fields.description')} className="md:col-span-4">
                  <Textarea {...register(`items.${i}.description` as const)} />
                </FieldShell>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={() => append(EMPTY_ITEM)} className="w-full">
            <Plus className="h-4 w-4" /> {t('events:detail.program.addItem')}
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          <Save className="h-4 w-4" /> {isSubmitting ? t('common:actions.saving') : t('common:actions.save')}
        </Button>
      </div>
    </form>
  );
}

function Header({ event }: { event: EventDto }) {
  const { t } = useTranslation(['events', 'common']);
  return (
    <header>
      <Link
        to="/dashboard/events/$eventId"
        params={{ eventId: event.id }}
        className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-secondary)] no-underline hover:text-[var(--color-primary)]"
      >
        <ArrowLeft className="h-3 w-3" /> {t('common:actions.back')}
      </Link>
      <h1
        className="text-2xl font-bold tracking-tight text-[var(--color-on-surface)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {t('events:detail.program.title')}
      </h1>
      <p className="mt-1 max-w-xl text-sm text-[var(--color-secondary)]">
        {t('events:detail.program.subtitle')}
      </p>
    </header>
  );
}
