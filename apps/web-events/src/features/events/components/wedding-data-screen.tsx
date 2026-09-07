import { Link, useParams } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Heart, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  useApiClient,
  type EventDto,
  type WeddingDetailDto,
} from '@/shared/api';
import {
  type UpdateWeddingDetailRequest,
  type WeddingAccommodationPayload,
  type WeddingDressCodeEntry,
  type WeddingDressCodePayload,
  type WeddingGiftRegistryPayload,
  type WeddingParentsPayload,
  type WeddingStoryPayload,
} from '@/features/events/wedding-detail.types';
import { Button, Card, CardContent, CardHeader, CardTitle, FieldShell, Input, Spinner, Textarea } from '@/shared/ui';

interface WeddingFormState {
  partner1Name: string;
  partner2Name: string;
  landingTitle: string;
  landingSubtitle: string;
  storyHtml: string;
  dressCodeEntries: WeddingDressCodeEntry[];
  giftRegistry: string;
  parents: string;
  accommodation: string;
}

/**
 * Wedding-specific extension screen. Each section maps to a dedicated
 * PUT endpoint on the BE (one for the couple+landing row, one per
 * invitation module). The screen batches updates through a single
 * submit so the user experience stays cohesive.
 *
 * Sections saved separately:
 *   - PUT /events/{id}/wedding-detail       (couple + landing)
 *   - PUT /events/{id}/wedding-story       (story body)
 *   - PUT /events/{id}/wedding-dress-code  (list of entries)
 *   - PUT /events/{id}/wedding-gift-registry
 *   - PUT /events/{id}/wedding-parents
 *   - PUT /events/{id}/wedding-accommodation
 */
export function WeddingDataScreen(): React.ReactElement {
  const { t } = useTranslation(['events', 'common']);
  const params = useParams({ strict: false }) as { eventId?: string };
  const eventId = params.eventId ?? '';
  const api = useApiClient();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const event = useQuery({
    queryKey: ['events', 'detail', eventId],
    queryFn: () => api.get<EventDto>(`/events/${eventId}`),
    enabled: Boolean(eventId),
  });

  const wedding = useQuery({
    queryKey: ['events', 'wedding-detail', eventId],
    queryFn: () => api.get<WeddingDetailDto>(`/events/${eventId}/wedding-detail`),
    enabled: Boolean(eventId),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isDirty },
  } = useForm<WeddingFormState>({
    defaultValues: {
      partner1Name: '',
      partner2Name: '',
      landingTitle: '',
      landingSubtitle: '',
      storyHtml: '',
      dressCodeEntries: [],
      giftRegistry: '',
      parents: '',
      accommodation: '',
    },
  });

  useEffect(() => {
    if (wedding.data) {
      const w = wedding.data;
      reset({
        partner1Name: w.partner1Name ?? '',
        partner2Name: w.partner2Name ?? '',
        landingTitle: w.landingTitle ?? '',
        landingSubtitle: w.landingSubtitle ?? '',
        storyHtml: w.storyHtml ?? '',
        dressCodeEntries: w.dressCode
          ? [{ title: 'General', body: w.dressCode }]
          : [],
        giftRegistry: w.giftRegistry ?? '',
        parents: w.parents ?? '',
        accommodation: w.accommodation ?? '',
      });
      setSavedAt(null);
    }
  }, [wedding.data, reset]);

  const dressEntries = watch('dressCodeEntries');

  if (event.isLoading || wedding.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!event.data) {
    return <></>;
  }

  const onSubmit = async (state: WeddingFormState) => {
    setSubmitting(true);
    try {
      const updateCoupleLanding: UpdateWeddingDetailRequest = {
        partner1Name: state.partner1Name || null,
        partner2Name: state.partner2Name || null,
        landingTitle: state.landingTitle || null,
        landingSubtitle: state.landingSubtitle || null,
      };
      await api.put<WeddingDetailDto>(
        `/events/${eventId}/wedding-detail`,
        updateCoupleLanding as unknown as WeddingDetailDto,
      );

      if (state.storyHtml && state.storyHtml.trim().length > 0) {
        const payload: WeddingStoryPayload = { body: state.storyHtml };
        await api.put<WeddingDetailDto>(
          `/events/${eventId}/wedding-story`,
          payload as unknown as WeddingDetailDto,
        );
      }

      const dress: WeddingDressCodePayload = {
        entries: state.dressCodeEntries.filter((e) => e.title && e.body),
      };
      await api.put<WeddingDetailDto>(
        `/events/${eventId}/wedding-dress-code`,
        dress as unknown as WeddingDetailDto,
      );

      if (state.giftRegistry && state.giftRegistry.trim().length > 0) {
        const payload: WeddingGiftRegistryPayload = { body: state.giftRegistry };
        await api.put<WeddingDetailDto>(
          `/events/${eventId}/wedding-gift-registry`,
          payload as unknown as WeddingDetailDto,
        );
      }
      if (state.parents && state.parents.trim().length > 0) {
        const payload: WeddingParentsPayload = { body: state.parents };
        await api.put<WeddingDetailDto>(
          `/events/${eventId}/wedding-parents`,
          payload as unknown as WeddingDetailDto,
        );
      }
      if (state.accommodation && state.accommodation.trim().length > 0) {
        const payload: WeddingAccommodationPayload = { body: state.accommodation };
        await api.put<WeddingDetailDto>(
          `/events/${eventId}/wedding-accommodation`,
          payload as unknown as WeddingDetailDto,
        );
      }

      await qc.invalidateQueries({
        queryKey: ['events', 'wedding-detail', eventId],
      });
      setSavedAt(new Date().toISOString());
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto w-full max-w-3xl space-y-6 px-8 py-8"
      data-testid="wedding-data"
    >
      <Header event={event.data} />

      {/* Couple + landing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-[var(--color-primary)]" />
            <CardTitle>{t('events:detail.weddings.section.couple')}</CardTitle>
          </div>
          <p className="text-xs text-[var(--color-secondary)]">Names flow into the invitation hero.</p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FieldShell label={t('events:detail.weddings.fields.partner1')} htmlFor="partner1Name">
            <Input id="partner1Name" {...register('partner1Name')} />
          </FieldShell>
          <FieldShell label={t('events:detail.weddings.fields.partner2')} htmlFor="partner2Name">
            <Input id="partner2Name" {...register('partner2Name')} />
          </FieldShell>
          <FieldShell label={t('events:detail.weddings.fields.landingTitle')} className="md:col-span-2">
            <Input {...register('landingTitle')} placeholder="Emma & James" />
          </FieldShell>
          <FieldShell label={t('events:detail.weddings.fields.landingSubtitle')} className="md:col-span-2">
            <Input {...register('landingSubtitle')} placeholder="Together with their families" />
          </FieldShell>
        </CardContent>
      </Card>

      {/* Story */}
      <Card>
        <CardHeader>
          <CardTitle>{t('events:detail.weddings.section.story')}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldShell
            label={t('events:detail.weddings.fields.storyHtml')}
            hint="Plain text or simple HTML. Up to ~4000 chars."
          >
            <Textarea rows={6} {...register('storyHtml')} />
          </FieldShell>
        </CardContent>
      </Card>

      {/* Dress code */}
      <Card>
        <CardHeader>
          <CardTitle>{t('events:detail.weddings.section.dressCode')}</CardTitle>
          <p className="text-xs text-[var(--color-secondary)]">Up to two dress codes (ceremony, reception…)</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {dressEntries.map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-1 gap-3 rounded-md border border-[var(--color-outline-variant)] p-3 md:grid-cols-3"
            >
              <FieldShell label="Title">
                <Input
                  placeholder="Ceremony"
                  {...register(`dressCodeEntries.${i}.title` as const)}
                />
              </FieldShell>
              <FieldShell label="Body" className="md:col-span-2">
                <Input
                  placeholder="White tie"
                  {...register(`dressCodeEntries.${i}.body` as const)}
                />
              </FieldShell>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setValue('dressCodeEntries', [
                ...dressEntries,
                { title: '', body: '' } satisfies WeddingDressCodeEntry,
              ])
            }
            disabled={dressEntries.length >= 2}
          >
            + Add entry
          </Button>
        </CardContent>
      </Card>

      {/* Gift registry */}
      <Card>
        <CardHeader>
          <CardTitle>{t('events:detail.weddings.section.gift')}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldShell
            label={t('events:detail.weddings.fields.giftRegistry')}
            hint="Link or short note"
          >
            <Textarea rows={3} placeholder="Honeymoon fund — https://…" {...register('giftRegistry')} />
          </FieldShell>
        </CardContent>
      </Card>

      {/* Parents */}
      <Card>
        <CardHeader>
          <CardTitle>{t('events:detail.weddings.section.parents')}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldShell label={t('events:detail.weddings.fields.parents')}>
            <Textarea rows={3} placeholder="Daughter of X & Y, son of A & B" {...register('parents')} />
          </FieldShell>
        </CardContent>
      </Card>

      {/* Accommodation */}
      <Card>
        <CardHeader>
          <CardTitle>{t('events:detail.weddings.section.accommodation')}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldShell label={t('events:detail.weddings.fields.accommodation')}>
            <Textarea rows={3} placeholder="Hotel block at… Book before…" {...register('accommodation')} />
          </FieldShell>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {savedAt && (
          <span className="text-xs text-[var(--color-status-confirmed-text)]">
            {t('events:detail.weddings.saved')} — {new Date(savedAt).toLocaleTimeString()}
          </span>
        )}
        <Button type="submit" disabled={!isDirty || submitting} data-testid="wedding-save">
          <Save className="h-4 w-4" /> {submitting ? t('common:actions.saving') : t('common:actions.save')}
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
        {t('events:detail.weddings.title')}
      </h1>
      <p className="mt-1 max-w-xl text-sm text-[var(--color-secondary)]">
        {t('events:detail.weddings.subtitle')}
      </p>
    </header>
  );
}
