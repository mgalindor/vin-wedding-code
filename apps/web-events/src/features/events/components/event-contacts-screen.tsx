import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useEventsService, type ContactEntry, type EventDto } from '@/features/events/events.service';
import { Button, Card, CardContent, CardHeader, CardTitle, FieldShell, Input, Spinner } from '@/shared/ui';

interface ContactsFormState {
  entries: Array<ContactEntry>;
}

/**
 * Generic "contacts" editor — the BE carries a list of contact
 * entries (`{ label, fullName, phone, email }[]`). Organizers add as
 * many as they need; one is usually labelled "Primary" and another
 * "Secondary", but the wire shape is unbounded. Removing all entries
 * is allowed (the contacts module then renders nothing on the
 * invitation).
 */
export function EventContactsScreen(): React.ReactElement {
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

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { isDirty, isSubmitting },
  } = useForm<ContactsFormState>({
    defaultValues: { entries: [{ fullName: '', label: 'Primary' }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'entries' });

  useEffect(() => {
    if (detail.data) {
      const list = detail.data.contacts?.entries ?? [];
      reset({
        entries:
          list.length > 0
            ? list.map((e) => ({
                label: e.label ?? '',
                fullName: e.fullName ?? '',
                phone: e.phone ?? '',
                email: e.email ?? '',
              }))
            : [{ fullName: '', label: 'Primary' }],
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

  const onSubmit = async (state: ContactsFormState) => {
    try {
      await service.putContacts(eventId, {
        entries: state.entries
          .filter((e) => e.fullName || e.phone || e.email)
          .map((e) => ({
            label: e.label || undefined,
            fullName: e.fullName || undefined,
            phone: e.phone || undefined,
            email: e.email || undefined,
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
      className="mx-auto w-full max-w-2xl space-y-6 px-8 py-8"
      data-testid="event-contacts"
    >
      <Header event={detail.data} />
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t('events:detail.contacts.title')}</CardTitle>
            <p className="text-xs text-[var(--color-secondary)]">
              {t('events:detail.contacts.subtitle')}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.map((field, i) => (
            <div
              key={field.id}
              className="rounded-lg border border-[var(--color-outline-variant)] p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-secondary)]">
                  Contact {i + 1}
                </h4>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-secondary)] hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)]"
                  aria-label={t('common:actions.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <FieldShell label="Role / label" hint="e.g. Primary, Reception">
                  <Input
                    placeholder="Primary"
                    {...register(`entries.${i}.label` as const)}
                  />
                </FieldShell>
                <FieldShell label="Full name" className="md:col-span-2">
                  <Input {...register(`entries.${i}.fullName` as const)} />
                </FieldShell>
                <FieldShell label="Phone">
                  <Input type="tel" {...register(`entries.${i}.phone` as const)} />
                </FieldShell>
                <FieldShell label="Email" className="md:col-span-2">
                  <Input type="email" {...register(`entries.${i}.email` as const)} />
                </FieldShell>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({ fullName: '', label: '', phone: '', email: '' })
            }
            className="w-full"
            data-testid="contacts-add"
          >
            <Plus className="h-4 w-4" /> Add contact
          </Button>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          <Save className="h-4 w-4" />{' '}
          {isSubmitting ? t('common:actions.saving') : t('common:actions.save')}
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
        {t('events:detail.contacts.title')}
      </h1>
      <p className="mt-1 max-w-xl text-sm text-[var(--color-secondary)]">
        {t('events:detail.contacts.subtitle')}
      </p>
    </header>
  );
}
