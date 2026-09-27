import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Plus, Star, Trash2, UsersRound } from 'lucide-react';

import type { CreateGuestGroupRequest } from '@/shared/api';
import { Button, FieldShell, Input, Select } from '@/shared/ui';

interface CreateGroupFormMember {
  fullName: string;
  primary: boolean;
}

interface CreateGroupFormValues {
  name: string;
  relationship: 'family' | 'friends' | 'other';
  sharedEmail: string;
  sharedPhone: string;
  members: CreateGroupFormMember[];
}

const EMPTY_MEMBER: CreateGroupFormMember = {
  fullName: '',
  primary: false,
};

interface CreateGroupFormProps {
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (dto: CreateGuestGroupRequest) => void;
}

/**
 * Form to create a guest group with one or more inline members.
 * Enforces "exactly one primary contact" client-side so the BE never
 * sees an invalid payload.
 */
export function CreateGroupForm({
  submitting,
  error,
  onCancel,
  onSubmit,
}: CreateGroupFormProps): React.ReactElement {
  const { t } = useTranslation(['guests', 'common']);
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateGroupFormValues>({
    defaultValues: {
      name: '',
      relationship: 'other',
      sharedEmail: '',
      sharedPhone: '',
      members: [{ ...EMPTY_MEMBER, primary: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'members',
  });

  const members = watch('members');

  const setPrimary = (idx: number): void => {
    members.forEach((_, i) =>
      setValue(`members.${i}.primary`, i === idx, { shouldDirty: true }),
    );
  };

  const onSubmitValid = (state: CreateGroupFormValues) => {
    const cleanMembers = state.members
      .filter((m) => m.fullName.trim())
      .map((m) => ({
        fullName: m.fullName.trim(),
        rsvpStatus: 'pending' as const,
        primary: m.primary,
      }));

    const hasPrimary = cleanMembers.some((m) => m.primary);
    if (!hasPrimary && cleanMembers.length > 0) {
      cleanMembers[0]!.primary = true;
    }

    onSubmit({
      name: state.name.trim(),
      relationship: state.relationship,
      sharedEmail: state.sharedEmail?.trim() || undefined,
      sharedPhone: state.sharedPhone?.trim() || undefined,
      guests: cleanMembers,
    });
    reset({
      name: '',
      relationship: 'other',
      sharedEmail: '',
      sharedPhone: '',
      members: [{ ...EMPTY_MEMBER, primary: true }],
    });
  };

  const primaryCount = members.filter((m) => m.primary).length;
  const hasAnyFilled = members.some((m) => m.fullName.trim());

  return (
    <form onSubmit={handleSubmit(onSubmitValid)} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FieldShell label={t('guests:groups.fields.name')} required error={errors.name?.message}>
          <Input
            placeholder={t('guests:groups.fields.namePlaceholder')}
            {...register('name', { required: 'Required' })}
          />
        </FieldShell>
        <FieldShell
          label={t('guests:groups.fields.relationship')}
          required
          error={errors.relationship?.message}
        >
          <Select
            invalid={Boolean(errors.relationship)}
            {...register('relationship', { required: 'Required' })}
            defaultValue="other"
          >
            <option value="family">{t('guests:groups.relationships.family')}</option>
            <option value="friends">{t('guests:groups.relationships.friends')}</option>
            <option value="other">{t('guests:groups.relationships.other')}</option>
          </Select>
        </FieldShell>
        <FieldShell label={t('guests:groups.fields.sharedEmail')}>
          <Input type="email" {...register('sharedEmail')} />
        </FieldShell>
        <FieldShell label={t('guests:groups.fields.sharedPhone')}>
          <Input type="tel" {...register('sharedPhone')} />
        </FieldShell>
      </div>

      <div className="space-y-2 rounded-md border border-[var(--color-outline-variant)] p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-secondary)]">
            {t('guests:groups.membersHeading')}
          </p>
          <p className="text-xs text-[var(--color-secondary)]">
            {t('guests:groups.fields.primaryHint', { count: primaryCount })}
          </p>
        </div>

        {fields.map((field, i) => {
          const member = members[i];
          const isPrimary = member?.primary ?? false;
          return (
            <div
              key={field.id}
              className="space-y-2 rounded-md border border-[var(--color-outline-variant)] p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-secondary)]">
                  {t('guests:groups.fields.memberLabel', { index: i + 1 })}
                  {isPrimary ? (
                    <span className="ml-2 inline-flex items-center rounded bg-[var(--color-surface-container-high)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-on-surface)]">
                      <Star className="mr-1 inline h-3 w-3" />
                      {t('guests:groups.primaryBadge')}
                    </span>
                  ) : null}
                </span>
                {fields.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(i)}
                    aria-label={t('guests:groups.removeMember')}
                    title={t('guests:groups.removeMember')}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-[var(--color-destructive)]" />
                  </Button>
                ) : null}
              </div>

              <FieldShell
                label={t('guests:guest.fullName')}
                required
                error={errors.members?.[i]?.fullName?.message}
              >
                <Input
                  {...register(`members.${i}.fullName` as const, { required: 'Required' })}
                  placeholder={t('guests:groups.fields.fullNamePlaceholder')}
                />
              </FieldShell>

              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant={isPrimary ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPrimary(i)}
                  disabled={isPrimary}
                  title={t('guests:groups.markPrimary')}
                  aria-label={t('guests:groups.markPrimary')}
                >
                  <Star className="h-3.5 w-3.5" />
                  {isPrimary ? t('guests:groups.primaryBadge') : t('guests:groups.markPrimary')}
                </Button>
              </div>
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ ...EMPTY_MEMBER, primary: false })}
          disabled={fields.length >= 12}
        >
          <Plus className="h-3.5 w-3.5" /> {t('guests:groups.addMember')}
        </Button>

        {hasAnyFilled && primaryCount === 0 ? (
          <p className="text-xs text-[var(--color-destructive)]">
            {t('guests:groups.fields.primaryRequired')}
          </p>
        ) : null}
      </div>

      {error ? (
        <div className="rounded border-l-4 border-destructive bg-error-container/30 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common:actions.cancel')}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? t('common:actions.saving') : t('guests:groups.addGroup')}
        </Button>
      </div>
    </form>
  );
}
