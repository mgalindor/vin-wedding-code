import { Link, useParams } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Heart,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  useApiClient,
  type EventDto,
  type EventLocation,
  type ProgramItem,
  type ContactEntry,
  type WeddingDetailDto,
} from '@/shared/api';

import {
  type UpdateWeddingDetailRequest,
  type WeddingAccommodationEntry,
  type WeddingAccommodationPayload,
  type WeddingDressCodeEntry,
  type WeddingDressCodePayload,
  type WeddingGiftRegistryLink,
  type WeddingGiftRegistryPayload,
  type WeddingLandingPayload,
  type WeddingParentsPayload,
  type WeddingStoryPayload,
} from '@/features/events/wedding-detail.types';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FieldShell,
  Input,
  Spinner,
  Textarea,
} from '@/shared/ui';

/**
 * Form-state shape mirrors what the screen renders and is independent
 * of the BE's `WeddingDetailDto` wire shape. Sections whose payload is
 * a list of entries use `useFieldArray` for stable add/remove semantics.
 */
interface WeddingFormState {
  partner1Name: string;
  partner2Name: string;
  countdownEnabled: boolean;
  landingPreTitle: string;
  storyBody: string;
  dressCodeEntries: WeddingDressCodeEntry[];
  giftRegistry: {
    notes: string;
    links: WeddingGiftRegistryLink[];
  };
  parents: {
    partner1Label: string;
    partner1Names: string[];
    partner2Label: string;
    partner2Names: string[];
  };
  accommodation: {
    entries: WeddingAccommodationEntry[];
  };
}

const EMPTY_DRESS_ENTRY: WeddingDressCodeEntry = { title: '', body: '' };
const EMPTY_GIFT_LINK: WeddingGiftRegistryLink = { label: '', url: '' };
const EMPTY_ACCOMMODATION_ENTRY: WeddingAccommodationEntry = {
  name: '',
  description: '',
  url: '',
  priceHint: '',
};

/**
 * Wedding-specific extension screen. Each section maps to a dedicated
 * PUT endpoint on the BE; the screen batches updates through a single
 * submit so the user experience stays cohesive.
 *
 * Sections saved separately:
 *   - PUT /events/{id}/wedding-detail       (couple + countdown)
 *   - PUT /events/{id}/wedding-landing      (preTitle)
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
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isDirty },
  } = useForm<WeddingFormState>({
    defaultValues: emptyFormState(),
  });

  const watchPartner1Label = watch('parents.partner1Label');
  const watchPartner2Label = watch('parents.partner2Label');

  const dressFields = useFieldArray({ control, name: 'dressCodeEntries' });
  const giftLinkFields = useFieldArray({ control, name: 'giftRegistry.links' });
  const accommodationFields = useFieldArray({
    control,
    name: 'accommodation.entries',
  });

  // Parent-name lists are arrays of plain strings; managing them with
  // useState avoids the `useFieldArray` generics-inference conflict that
  // appears when the same `useForm` instance owns multiple field arrays.
  const [p1Names, setP1Names] = useState<string[]>([]);
  const [p2Names, setP2Names] = useState<string[]>([]);

  const setPartnerNames = (
    partner: 1 | 2,
    next: string[],
  ): void => {
    if (partner === 1) setP1Names(next);
    else setP2Names(next);
  };

  // Locations / program / contacts are also arrays of objects with
  // primitive fields. We sync them into form state via setValue rather
  // than useFieldArray to avoid generic-inference headaches; the form
  // state still owns the source of truth at submit time.
  const [locations, setLocations] = useState<EventLocation[]>([]);
  // Program is split into multiple days (each with its own date and
  // items list). The BE's ProgramPayloadDto accepts `days[]` and the
  // existing schema allows up to 7 days; for single-day events the
  // user just keeps one day and the form behaves as before.
  const [programDays, setProgramDays] = useState<
    { date: string; items: ProgramItem[] }[]
  >([{ date: '', items: [] }]);
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  // Track whether any of the event-level sections were touched so
  // the Save button reflects local-state changes too, not just
  // react-hook-form dirty.
  const [eventSectionsDirty, setEventSectionsDirty] = useState(false);
  const markDirty = (): void => setEventSectionsDirty(true);

  const updateLocation = (i: number, patch: Partial<EventLocation>): void => {
    setLocations((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
    markDirty();
  };
  const updateProgramDay = (
    dayIndex: number,
    patch: Partial<{ date: string; items: ProgramItem[] }>,
  ): void => {
    setProgramDays((prev) =>
      prev.map((d, idx) => (idx === dayIndex ? { ...d, ...patch } : d)),
    );
    markDirty();
  };
  const updateProgramItem = (
    dayIndex: number,
    itemIndex: number,
    patch: Partial<ProgramItem>,
  ): void => {
    setProgramDays((prev) =>
      prev.map((d, idx) =>
        idx === dayIndex
          ? {
              ...d,
              items: d.items.map((it, j) => (j === itemIndex ? { ...it, ...patch } : it)),
            }
          : d,
      ),
    );
    markDirty();
  };
  const addProgramDay = (): void => {
    setProgramDays((prev) => [...prev, { date: '', items: [] }]);
    markDirty();
  };
  const removeProgramDay = (dayIndex: number): void => {
    setProgramDays((prev) => prev.filter((_, idx) => idx !== dayIndex));
    markDirty();
  };
  const addProgramItem = (dayIndex: number): void => {
    setProgramDays((prev) =>
      prev.map((d, idx) =>
        idx === dayIndex
          ? { ...d, items: [...d.items, { time: '', title: '', detail: '' }] }
          : d,
      ),
    );
    markDirty();
  };
  const removeProgramItem = (dayIndex: number, itemIndex: number): void => {
    setProgramDays((prev) =>
      prev.map((d, idx) =>
        idx === dayIndex
          ? { ...d, items: d.items.filter((_, j) => j !== itemIndex) }
          : d,
      ),
    );
    markDirty();
  };
  const updateContact = (i: number, patch: Partial<ContactEntry>): void => {
    setContacts((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
    markDirty();
  };

  useEffect(() => {
    if (wedding.data) {
      const w = wedding.data;
      reset({
        partner1Name: w.partner1Name ?? '',
        partner2Name: w.partner2Name ?? '',
        countdownEnabled: w.countdownEnabled ?? false,
        landingPreTitle: w.landing?.preTitle ?? '',
        storyBody: w.story?.body ?? '',
        dressCodeEntries:
          w.dressCode?.entries && w.dressCode.entries.length > 0
            ? w.dressCode.entries.map((e) => ({ title: e.title, body: e.body }))
            : [EMPTY_DRESS_ENTRY],
        giftRegistry: {
          notes: w.giftRegistry?.notes ?? '',
          links:
            w.giftRegistry?.links && w.giftRegistry.links.length > 0
              ? w.giftRegistry.links.map((l) => ({ label: l.label, url: l.url }))
              : [],
        },
        parents: {
          partner1Label: w.parents?.partner1Label ?? '',
          partner1Names: w.parents?.partner1Names ?? [],
          partner2Label: w.parents?.partner2Label ?? '',
          partner2Names: w.parents?.partner2Names ?? [],
        },
        accommodation: {
          entries:
            w.accommodation?.entries && w.accommodation.entries.length > 0
              ? w.accommodation.entries.map((e) => ({
                  name: e.name,
                  description: e.description ?? '',
                  url: e.url ?? '',
                  priceHint: e.priceHint ?? '',
                }))
              : [],
        },
      });
      setP1Names(w.parents?.partner1Names ?? []);
      setP2Names(w.parents?.partner2Names ?? []);
      // Locations / program / contacts live on EventDto (not WeddingDetailDto).
      // Sync from `event` query so the form reflects the latest BE state.
      setLocations(
        event.data?.locations?.items?.map((l) => ({
          label: l.label ?? '',
          name: l.name ?? '',
          address: l.address ?? '',
          city: l.city ?? '',
          mapUrl: l.mapUrl ?? '',
          startsAt: l.startsAt ?? '',
          notes: l.notes ?? '',
        })) ?? [],
      );
      // The BE ships program grouped by day as `program.days[]`; the
      // shared normalizer flattens it to `program.items[]` for the FE.
      // Items carry `detail` (not `description`) on the wire.
      const programItemsFromBE =
        event.data?.program?.items?.map((it) => ({
          time: it.time ?? '',
          title: it.title ?? '',
          detail: it.detail ?? '',
        })) ?? [];
      const programDayDate = event.data?.eventDate ?? '';
      setProgramDays(
        programItemsFromBE.length > 0 || programDayDate
          ? [{ date: programDayDate, items: programItemsFromBE }]
          : [{ date: '', items: [] }],
      );
      setContacts(
        event.data?.contacts?.entries?.map((c) => ({
          label: c.label ?? '',
          fullName: c.fullName ?? '',
          phone: c.phone ?? '',
          email: c.email ?? '',
        })) ?? [],
      );
      setEventSectionsDirty(false);
      setSavedAt(null);
    }
  }, [wedding.data, event.data, reset]);

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
      const updateCouple: UpdateWeddingDetailRequest = {
        partner1Name: state.partner1Name.trim() || null,
        partner2Name: state.partner2Name.trim() || null,
        countdownEnabled: state.countdownEnabled,
      };
      await api.put<WeddingDetailDto>(
        `/events/${eventId}/wedding-detail`,
        updateCouple as unknown as WeddingDetailDto,
      );

      const landing: WeddingLandingPayload = {
        preTitle: state.landingPreTitle.trim() || null,
      };
      await api.put<WeddingDetailDto>(
        `/events/${eventId}/wedding-landing`,
        landing as unknown as WeddingDetailDto,
      );

      const story: WeddingStoryPayload = { body: state.storyBody };
      await api.put<WeddingDetailDto>(
        `/events/${eventId}/wedding-story`,
        story as unknown as WeddingDetailDto,
      );

      const dress: WeddingDressCodePayload = {
        entries: state.dressCodeEntries
          .map((e) => ({ title: e.title.trim(), body: e.body.trim() }))
          .filter((e) => e.title && e.body),
      };
      await api.put<WeddingDetailDto>(
        `/events/${eventId}/wedding-dress-code`,
        dress as unknown as WeddingDetailDto,
      );

      const gift: WeddingGiftRegistryPayload = {
        notes: state.giftRegistry.notes.trim() || null,
        links: state.giftRegistry.links
          .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
          .filter((l) => l.label && l.url),
      };
      await api.put<WeddingDetailDto>(
        `/events/${eventId}/wedding-gift-registry`,
        gift as unknown as WeddingDetailDto,
      );

      const parents: WeddingParentsPayload = {
        partner1Label: state.parents.partner1Label.trim() || null,
        partner1Names: p1Names.filter((n) => n.trim()),
        partner2Label: state.parents.partner2Label.trim() || null,
        partner2Names: p2Names.filter((n) => n.trim()),
      };
      await api.put<WeddingDetailDto>(
        `/events/${eventId}/wedding-parents`,
        parents as unknown as WeddingDetailDto,
      );

      const accommodation: WeddingAccommodationPayload = {
        entries: state.accommodation.entries
          .filter((e) => e.name.trim())
          .map((e) => ({
            name: e.name.trim(),
            description: e.description?.trim() || null,
            url: e.url?.trim() || null,
            priceHint: e.priceHint?.trim() || null,
          })),
      };
      await api.put<WeddingDetailDto>(
        `/events/${eventId}/wedding-accommodation`,
        accommodation as unknown as WeddingDetailDto,
      );

      // ----- Event-level data (locations / program / contacts) -----
      // These live on EventDto, not WeddingDetailDto, so they have
      // their own endpoints. Sending only non-empty entries keeps the
      // BE validation happy (NotEmpty on the lists).
      const cleanLocations = locations.filter(
        (l) => (l.label ?? '').trim() || (l.name ?? '').trim(),
      );
      await api.put<EventDto>(`/events/${eventId}/locations`, {
        entries: cleanLocations.map((l) => ({
          label: l.label?.trim() || '',
          name: l.name?.trim() || '',
          address: l.address?.trim() || null,
          city: l.city?.trim() || null,
          mapUrl: l.mapUrl?.trim() || null,
          startsAt: l.startsAt?.trim() || null,
          notes: l.notes?.trim() || null,
        })),
      });

      // Build the program payload: one entry per day. Days without any
      // title items are dropped so we don't send empty `items` arrays
      // (the BE rejects them with @NotEmpty).
      const fallbackDate = event.data?.eventDate ?? null;
      const programDaysPayload = programDays
        .filter((d) => d.items.some((p) => p.title?.trim()))
        .map((d) => ({
          date: d.date || fallbackDate,
          label: '',
          items: d.items
            .filter((p) => p.title?.trim())
            .map((p) => ({
              time: p.time?.trim() || '',
              title: p.title.trim(),
              detail: p.detail?.trim() || undefined,
            })),
        }));
      await api.put<EventDto>(`/events/${eventId}/program`, {
        days: programDaysPayload,
      });

      const cleanContacts = contacts.filter((c) => c.fullName?.trim());
      await api.put<EventDto>(`/events/${eventId}/contacts`, {
        entries: cleanContacts.map((c) => ({
          label: c.label?.trim() || '',
          fullName: c.fullName.trim(),
          phone: c.phone?.trim() || null,
          email: c.email?.trim() || null,
        })),
      });

      await qc.invalidateQueries({
        queryKey: ['events', 'wedding-detail', eventId],
      });
      await qc.invalidateQueries({
        queryKey: ['events', 'detail', eventId],
      });
      setEventSectionsDirty(false);
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
          <p className="text-xs text-[var(--color-secondary)]">
            Names flow into the invitation hero.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FieldShell required label={t('events:detail.weddings.fields.partner1')} htmlFor="partner1Name">
            <Input id="partner1Name" {...register('partner1Name')} />
          </FieldShell>
          <FieldShell required label={t('events:detail.weddings.fields.partner2')} htmlFor="partner2Name">
            <Input id="partner2Name" {...register('partner2Name')} />
          </FieldShell>
          <FieldShell
            label={t('events:detail.weddings.fields.landingPreTitle')}
            hint={t('events:detail.weddings.fields.landingPreTitleHint')}
            className="md:col-span-2"
          >
            <Input
              {...register('landingPreTitle')}
              placeholder={t('events:detail.weddings.fields.landingPreTitlePlaceholder')}
            />
          </FieldShell>
          <label className="md:col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('countdownEnabled')} />
            <span>{t('events:detail.weddings.fields.countdownEnabled')}</span>
          </label>
        </CardContent>
      </Card>

      {/* Parents */}
      <Card>
        <CardHeader>
          <CardTitle>{t('events:detail.weddings.section.parents')}</CardTitle>
          <p className="text-xs text-[var(--color-secondary)]">
            {t('events:detail.weddings.fields.parentsHint')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ParentBlock
            index={1}
            partnerLabel={watchPartner1Label}
            setPartnerLabel={(v) => setValue('parents.partner1Label', v, { shouldDirty: true })}
            names={p1Names}
            setNames={(next) => setPartnerNames(1, next)}
            t={t}
          />
          <ParentBlock
            index={2}
            partnerLabel={watchPartner2Label}
            setPartnerLabel={(v) => setValue('parents.partner2Label', v, { shouldDirty: true })}
            names={p2Names}
            setNames={(next) => setPartnerNames(2, next)}
            t={t}
          />
        </CardContent>
      </Card>

      {/* Story */}
      <Card>
        <CardHeader>
          <CardTitle>{t('events:detail.weddings.section.story')}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldShell
            required
            label={t('events:detail.weddings.fields.storyBody')}
            hint={t('events:detail.weddings.fields.storyBodyHint')}
          >
            <Textarea rows={6} {...register('storyBody')} />
          </FieldShell>
        </CardContent>
      </Card>

      {/* Dress code */}
      <Card>
        <CardHeader>
          <CardTitle>{t('events:detail.weddings.section.dressCode')}</CardTitle>
          <p className="text-xs text-[var(--color-secondary)]">
            {t('events:detail.weddings.fields.dressCodeHint')}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {dressFields.fields.map((field, i) => (
            <div
              key={field.id}
              className="space-y-3 rounded-md border border-[var(--color-outline-variant)] p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-secondary)]">
                  {t('events:detail.weddings.fields.dressCodeEntryLabel', {
                    index: i + 1,
                  })}
                </span>
                {dressFields.fields.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => dressFields.remove(i)}
                    aria-label={t('events:detail.weddings.actions.remove')}
                    title={t('events:detail.weddings.actions.remove')}
                  >
                    <Trash2 className="h-4 w-4" />{' '}
                    {t('events:detail.weddings.actions.remove')}
                  </Button>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <FieldShell required label={t('events:detail.weddings.fields.dressCodeTitle')}>
                  <Input
                    placeholder={t('events:detail.weddings.fields.dressCodeTitlePlaceholder')}
                    {...register(`dressCodeEntries.${i}.title` as const)}
                  />
                </FieldShell>
                <FieldShell
                  required
                  label={t('events:detail.weddings.fields.dressCodeBody')}
                  className="md:col-span-2"
                >
                  <Input
                    placeholder={t('events:detail.weddings.fields.dressCodeBodyPlaceholder')}
                    {...register(`dressCodeEntries.${i}.body` as const)}
                  />
                </FieldShell>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => dressFields.append(EMPTY_DRESS_ENTRY)}
            disabled={dressFields.fields.length >= 2}
          >
            <Plus className="h-4 w-4" /> {t('events:detail.weddings.actions.addDressCode')}
          </Button>
        </CardContent>
      </Card>

      {/* Gift registry */}
      <Card>
        <CardHeader>
          <CardTitle>{t('events:detail.weddings.section.gift')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FieldShell
            label={t('events:detail.weddings.fields.giftNotes')}
            hint={t('events:detail.weddings.fields.giftNotesHint')}
          >
            <Textarea
              rows={3}
              placeholder={t('events:detail.weddings.fields.giftNotesPlaceholder')}
              {...register('giftRegistry.notes')}
            />
          </FieldShell>

          {giftLinkFields.fields.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-secondary)]">
                {t('events:detail.weddings.fields.giftLinks')}
              </p>
              {giftLinkFields.fields.map((field, i) => (
                <div
                  key={field.id}
                  className="space-y-2 rounded-md border border-[var(--color-outline-variant)] p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-secondary)]">
                      {t('events:detail.weddings.fields.giftLinkEntryLabel', {
                        index: i + 1,
                      })}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => giftLinkFields.remove(i)}
                      aria-label={t('events:detail.weddings.actions.remove')}
                      title={t('events:detail.weddings.actions.remove')}
                    >
                      <Trash2 className="h-4 w-4" />{' '}
                      {t('events:detail.weddings.actions.remove')}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_2fr]">
                    <FieldShell required label={t('events:detail.weddings.fields.giftLinkLabel')}>
                      <Input
                        {...register(`giftRegistry.links.${i}.label` as const)}
                        placeholder={t('events:detail.weddings.fields.giftLinkLabelPlaceholder')}
                      />
                    </FieldShell>
                    <FieldShell required label={t('events:detail.weddings.fields.giftLinkUrl')}>
                      <Input
                        type="url"
                        {...register(`giftRegistry.links.${i}.url` as const)}
                        placeholder="https://…"
                      />
                    </FieldShell>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <Button
            type="button"
            variant="outline"
            onClick={() => giftLinkFields.append(EMPTY_GIFT_LINK)}
            disabled={giftLinkFields.fields.length >= 8}
          >
            <Plus className="h-4 w-4" /> {t('events:detail.weddings.actions.addGiftLink')}
          </Button>
        </CardContent>
      </Card>

      {/* Accommodation */}
      <Card>
        <CardHeader>
          <CardTitle>{t('events:detail.weddings.section.accommodation')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {accommodationFields.fields.length === 0 ? (
            <p className="text-sm text-[var(--color-secondary)]">
              {t('events:detail.weddings.fields.accommodationEmpty')}
            </p>
          ) : null}
          {accommodationFields.fields.map((field, i) => (
            <div
              key={field.id}
              className="space-y-3 rounded-md border border-[var(--color-outline-variant)] p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-secondary)]">
                  {t('events:detail.weddings.fields.accommodationEntryLabel', {
                    index: i + 1,
                  })}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => accommodationFields.remove(i)}
                  aria-label={t('events:detail.weddings.actions.remove')}
                  title={t('events:detail.weddings.actions.remove')}
                >
                  <Trash2 className="h-4 w-4" /> {t('events:detail.weddings.actions.remove')}
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FieldShell required label={t('events:detail.weddings.fields.accommodationName')}>
                <Input
                  {...register(`accommodation.entries.${i}.name` as const)}
                  placeholder={t(
                    'events:detail.weddings.fields.accommodationNamePlaceholder',
                  )}
                />
              </FieldShell>
              <FieldShell label={t('events:detail.weddings.fields.accommodationDescription')}>
                <Input
                  {...register(`accommodation.entries.${i}.description` as const)}
                  placeholder={t(
                    'events:detail.weddings.fields.accommodationDescriptionPlaceholder',
                  )}
                />
              </FieldShell>
              <FieldShell label={t('events:detail.weddings.fields.accommodationUrl')}>
                <Input
                  type="url"
                  {...register(`accommodation.entries.${i}.url` as const)}
                  placeholder="https://…"
                />
              </FieldShell>
              <FieldShell
                label={t('events:detail.weddings.fields.accommodationPriceHint')}
                hint={t('events:detail.weddings.fields.accommodationPriceHintHint')}
              >
                <Input
                  {...register(`accommodation.entries.${i}.priceHint` as const)}
                  placeholder={t(
                    'events:detail.weddings.fields.accommodationPriceHintPlaceholder',
                  )}
                />
              </FieldShell>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => accommodationFields.append(EMPTY_ACCOMMODATION_ENTRY)}
            disabled={accommodationFields.fields.length >= 6}
          >
            <Plus className="h-4 w-4" /> {t('events:detail.weddings.actions.addAccommodation')}
          </Button>
        </CardContent>
      </Card>

      {/* Locations (event-level data) */}
      <Card>
        <CardHeader>
          <CardTitle>{t('events:detail.weddings.section.locations')}</CardTitle>
          <p className="text-xs text-[var(--color-secondary)]">
            {t('events:detail.weddings.fields.locationsHint')}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {locations.length === 0 ? (
            <p className="text-sm text-[var(--color-secondary)]">
              {t('events:detail.weddings.fields.locationsEmpty')}
            </p>
          ) : null}
          {locations.map((loc, i) => (
            <div
              key={i}
              className="space-y-3 rounded-md border border-[var(--color-outline-variant)] p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-secondary)]">
                  {t('events:detail.weddings.fields.locationLabel', { index: i + 1 })}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setLocations(locations.filter((_, idx) => idx !== i));
                    markDirty();
                  }}
                  aria-label={t('events:detail.weddings.actions.remove')}
                  title={t('events:detail.weddings.actions.remove')}
                >
                  <Trash2 className="h-4 w-4" />{' '}
                  {t('events:detail.weddings.actions.remove')}
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FieldShell
                  required
                  label={t('events:detail.weddings.fields.locationType')}
                  hint={t('events:detail.weddings.fields.locationTypeHint')}
                >
                  <Input
                    value={loc.label ?? ''}
                    onChange={(e) => updateLocation(i, { label: e.target.value })}
                    placeholder={t('events:detail.weddings.fields.locationTypePlaceholder')}
                  />
                </FieldShell>
                <FieldShell label={t('events:detail.weddings.fields.locationName')}>
                  <Input
                    value={loc.name ?? ''}
                    onChange={(e) => updateLocation(i, { name: e.target.value })}
                  />
                </FieldShell>
                <FieldShell label={t('events:detail.weddings.fields.locationAddress')}>
                  <Input
                    value={loc.address ?? ''}
                    onChange={(e) => updateLocation(i, { address: e.target.value })}
                  />
                </FieldShell>
                <FieldShell label={t('events:detail.weddings.fields.locationCity')}>
                  <Input
                    value={loc.city ?? ''}
                    onChange={(e) => updateLocation(i, { city: e.target.value })}
                  />
                </FieldShell>
                <FieldShell label={t('events:detail.weddings.fields.locationMapsUrl')}>
                  <Input
                    type="url"
                    value={loc.mapUrl ?? ''}
                    onChange={(e) => updateLocation(i, { mapUrl: e.target.value })}
                    placeholder="https://maps…"
                  />
                </FieldShell>
                <FieldShell label={t('events:detail.weddings.fields.locationStartsAt')}>
                  <Input
                    value={loc.startsAt ?? ''}
                    onChange={(e) => updateLocation(i, { startsAt: e.target.value })}
                    placeholder="HH:mm"
                  />
                </FieldShell>
                <FieldShell
                  label={t('events:detail.weddings.fields.locationNotes')}
                  className="md:col-span-2"
                >
                  <Input
                    value={loc.notes ?? ''}
                    onChange={(e) => updateLocation(i, { notes: e.target.value })}
                  />
                </FieldShell>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setLocations([
                ...locations,
                { label: '', name: '', address: '', city: '', mapUrl: '', startsAt: '', notes: '' },
              ])
            }
            disabled={locations.length >= 8}
          >
            <Plus className="h-4 w-4" /> {t('events:detail.weddings.actions.addLocation')}
          </Button>
        </CardContent>
      </Card>

      {/* Program (event-level data) — multi-day aware */}
      <Card>
        <CardHeader>
          <CardTitle>{t('events:detail.weddings.section.program')}</CardTitle>
          <p className="text-xs text-[var(--color-secondary)]">
            {t('events:detail.weddings.fields.programHint')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {programDays.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className="space-y-3 rounded-md border border-[var(--color-outline-variant)] p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-secondary)]">
                  {t('events:detail.weddings.fields.programDayLabel', { index: dayIndex + 1 })}
                </span>
                {programDays.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeProgramDay(dayIndex)}
                    aria-label={t('events:detail.weddings.actions.remove')}
                  >
                    <Trash2 className="h-4 w-4" />{' '}
                    {t('events:detail.weddings.actions.remove')}
                  </Button>
                ) : null}
              </div>
              <FieldShell required label={t('events:detail.weddings.fields.programDate')}>
                <Input
                  type="date"
                  value={day.date}
                  onChange={(e) => updateProgramDay(dayIndex, { date: e.target.value })}
                />
              </FieldShell>

              {day.items.length === 0 ? (
                <p className="text-sm text-[var(--color-secondary)]">
                  {t('events:detail.weddings.fields.programEmpty')}
                </p>
              ) : null}

              {day.items.map((it, itemIndex) => (
                <div
                  key={itemIndex}
                  className="space-y-3 rounded-md border border-dashed border-[var(--color-outline-variant)] p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-secondary)]">
                      {t('events:detail.weddings.fields.programItemLabel', { index: itemIndex + 1 })}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeProgramItem(dayIndex, itemIndex)}
                      aria-label={t('events:detail.weddings.actions.remove')}
                    >
                      <Trash2 className="h-4 w-4" />{' '}
                      {t('events:detail.weddings.actions.remove')}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <FieldShell required label={t('events:detail.weddings.fields.programTime')}>
                      <Input
                        value={it.time ?? ''}
                        onChange={(e) =>
                          updateProgramItem(dayIndex, itemIndex, { time: e.target.value })
                        }
                        placeholder="HH:mm"
                      />
                    </FieldShell>
                    <FieldShell
                      required
                      label={t('events:detail.weddings.fields.programTitle')}
                      className="md:col-span-2"
                    >
                      <Input
                        value={it.title ?? ''}
                        onChange={(e) =>
                          updateProgramItem(dayIndex, itemIndex, { title: e.target.value })
                        }
                      />
                    </FieldShell>
                  </div>
                  <FieldShell label={t('events:detail.weddings.fields.programDescription')}>
                    <Input
                      value={it.detail ?? ''}
                      onChange={(e) =>
                        updateProgramItem(dayIndex, itemIndex, { detail: e.target.value })
                      }
                    />
                  </FieldShell>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addProgramItem(dayIndex)}
                disabled={day.items.length >= 24}
              >
                <Plus className="h-3.5 w-3.5" />{' '}
                {t('events:detail.weddings.actions.addProgramItem')}
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addProgramDay}
            disabled={programDays.length >= 7}
          >
            <Plus className="h-4 w-4" /> {t('events:detail.weddings.actions.addProgramDay')}
          </Button>
        </CardContent>
      </Card>

      {/* Contacts (event-level data) */}
      <Card>
        <CardHeader>
          <CardTitle>{t('events:detail.weddings.section.contacts')}</CardTitle>
          <p className="text-xs text-[var(--color-secondary)]">
            {t('events:detail.weddings.fields.contactsHint')}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {contacts.length === 0 ? (
            <p className="text-sm text-[var(--color-secondary)]">
              {t('events:detail.weddings.fields.contactsEmpty')}
            </p>
          ) : null}
          {contacts.map((c, i) => (
            <div
              key={i}
              className="space-y-3 rounded-md border border-[var(--color-outline-variant)] p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-secondary)]">
                  {t('events:detail.weddings.fields.contactLabel', { index: i + 1 })}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setContacts(contacts.filter((_, idx) => idx !== i));
                    markDirty();
                  }}
                  aria-label={t('events:detail.weddings.actions.remove')}
                >
                  <Trash2 className="h-4 w-4" />{' '}
                  {t('events:detail.weddings.actions.remove')}
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FieldShell required label={t('events:detail.weddings.fields.contactRole')}>
                  <Input
                    value={c.label ?? ''}
                    onChange={(e) => updateContact(i, { label: e.target.value })}
                    placeholder={t('events:detail.weddings.fields.contactRolePlaceholder')}
                  />
                </FieldShell>
                <FieldShell required label={t('events:detail.weddings.fields.contactFullName')}>
                  <Input
                    value={c.fullName ?? ''}
                    onChange={(e) => updateContact(i, { fullName: e.target.value })}
                  />
                </FieldShell>
                <FieldShell label={t('events:detail.weddings.fields.contactPhone')}>
                  <Input
                    type="tel"
                    value={c.phone ?? ''}
                    onChange={(e) => updateContact(i, { phone: e.target.value })}
                  />
                </FieldShell>
                <FieldShell label={t('events:detail.weddings.fields.contactEmail')}>
                  <Input
                    type="email"
                    value={c.email ?? ''}
                    onChange={(e) => updateContact(i, { email: e.target.value })}
                  />
                </FieldShell>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setContacts([...contacts, { label: '', fullName: '', phone: '', email: '' }])
            }
            disabled={contacts.length >= 10}
          >
            <Plus className="h-4 w-4" /> {t('events:detail.weddings.actions.addContact')}
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {savedAt ? (
          <span className="text-xs text-[var(--color-status-confirmed-text)]">
            {t('events:detail.weddings.saved')} — {new Date(savedAt).toLocaleTimeString()}
          </span>
        ) : null}
        <Button
          type="submit"
          disabled={(!isDirty && !eventSectionsDirty) || submitting}
          data-testid="wedding-save"
        >
          <Save className="h-4 w-4" />{' '}
          {submitting ? t('common:actions.saving') : t('common:actions.save')}
        </Button>
      </div>
    </form>
  );
}

function emptyFormState(): WeddingFormState {
  return {
    partner1Name: '',
    partner2Name: '',
    countdownEnabled: false,
    landingPreTitle: '',
    storyBody: '',
    dressCodeEntries: [EMPTY_DRESS_ENTRY],
    giftRegistry: { notes: '', links: [] },
    parents: {
      partner1Label: '',
      partner1Names: [],
      partner2Label: '',
      partner2Names: [],
    },
    accommodation: { entries: [] },
  };
}

interface ParentBlockProps {
  index: 1 | 2;
  partnerLabel: string;
  setPartnerLabel: (v: string) => void;
  names: string[];
  setNames: (next: string[]) => void;
  t: ReturnType<typeof useTranslation>['t'];
}

function ParentBlock({
  index,
  partnerLabel,
  setPartnerLabel,
  names,
  setNames,
  t,
}: ParentBlockProps): React.ReactElement {
  const updateName = (i: number, value: string): void => {
    setNames(names.map((n, idx) => (idx === i ? value : n)));
  };
  const removeName = (i: number): void => {
    setNames(names.filter((_, idx) => idx !== i));
  };
  const addName = (): void => {
    if (names.length >= 6) return;
    setNames([...names, '']);
  };
  return (
    <div className="space-y-2 rounded-md border border-[var(--color-outline-variant)] p-3">
      <FieldShell
        label={t('events:detail.weddings.fields.parentLabel', { partner: index })}
      >
        <Input
          value={partnerLabel}
          onChange={(e) => setPartnerLabel(e.target.value)}
          placeholder={t('events:detail.weddings.fields.parentLabelPlaceholder')}
        />
      </FieldShell>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-secondary)]">
          {t('events:detail.weddings.fields.parentNames', { partner: index })}
        </p>
        {names.length === 0 ? (
          <p className="text-xs text-[var(--color-secondary)]">
            {t('events:detail.weddings.fields.parentNamesEmpty')}
          </p>
        ) : null}
        {names.map((name, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => updateName(i, e.target.value)}
              placeholder={t('events:detail.weddings.fields.parentNamePlaceholder')}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => removeName(i)}
              aria-label={t('events:detail.weddings.actions.remove')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={addName}
          disabled={names.length >= 6}
        >
          <Plus className="h-4 w-4" />{' '}
          {t('events:detail.weddings.actions.addParentName', { partner: index })}
        </Button>
      </div>
    </div>
  );
}

function Header({ event }: { event: EventDto }): React.ReactElement {
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