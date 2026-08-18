import { type OnboardWeddingPlannerDto } from '@wendy/contracts';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui/button';

import { generateInitialPassword, PASSWORD_LENGTH } from '../generate-password';

interface OnboardFormProps {
  isSubmitting: boolean;
  serverError?: { field?: string; message: string } | null;
  onSubmit: (dto: OnboardWeddingPlannerDto) => void | Promise<void>;
  onCancel: () => void;
}

export function OnboardWeddingPlannerForm({
  isSubmitting,
  serverError,
  onSubmit,
  onCancel,
}: OnboardFormProps): React.ReactElement {
  const { t } = useTranslation('admin-onboarding');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<OnboardWeddingPlannerDto>({
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
      phone: '',
    },
  });

  const passwordValue = watch('password');
  const passwordLength = passwordValue?.length ?? 0;
  const passwordInRange =
    passwordLength >= PASSWORD_LENGTH.MIN &&
    passwordLength <= PASSWORD_LENGTH.MAX;

  const slugPattern = {
    value: /^[a-z0-9]+$/,
    message: t('form.errors.usernameFormat'),
  };

  const handleGeneratePassword = () => {
    setValue('password', generateInitialPassword(), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const submit = handleSubmit(async (dto) => {
    await onSubmit(dto);
  });

  const fieldError = (field: string): string | undefined => {
    const local = (errors as Record<string, { message?: string } | undefined>)[
      field
    ]?.message;
    if (local) return local;
    if (serverError?.field === field) return serverError.message;
    return undefined;
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1 block text-sm font-semibold text-[#1c1b1a]">
            {t('form.firstName')}
          </label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            disabled={isSubmitting}
            className="w-full rounded border border-[#d0c5af] bg-white px-4 py-3 text-sm text-[#1c1b1a] placeholder-[#a89f8f] focus:outline-none focus:ring-2 focus:ring-[#735c00]"
            {...register('firstName', {
              required: t('form.errors.required'),
              maxLength: 120,
            })}
          />
{fieldError('firstName') && (
            <p className="mt-1 text-xs text-[#ba1a1a]">
              {fieldError('firstName')}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1 block text-sm font-semibold text-[#1c1b1a]">
            {t('form.lastName')}
          </label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            disabled={isSubmitting}
            className="w-full rounded border border-[#d0c5af] bg-white px-4 py-3 text-sm text-[#1c1b1a] placeholder-[#a89f8f] focus:outline-none focus:ring-2 focus:ring-[#735c00]"
            {...register('lastName', {
              required: t('form.errors.required'),
              maxLength: 120,
            })}
          />
          {fieldError('lastName') && (
            <p className="mt-1 text-xs text-[#ba1a1a]">
              {fieldError('lastName')}
            </p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-semibold text-[#1c1b1a]">
          {t('form.email')}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          disabled={isSubmitting}
          className="w-full rounded border border-[#d0c5af] bg-white px-4 py-3 text-sm text-[#1c1b1a] placeholder-[#a89f8f] focus:outline-none focus:ring-2 focus:ring-[#735c00]"
          {...register('email', {
            required: t('form.errors.required'),
            pattern: {
              // Accept either FQDN or `slug@<suffix>` shapes.
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$|^[a-z0-9]+@[a-z0-9]+$/,
              message: t('form.errors.emailFormat'),
            },
          })}
        />
        {fieldError('email') && (
          <p className="mt-1 text-xs text-[#ba1a1a]">
            {fieldError('email')}
          </p>
        )}
      </div>

      {/* Username (slug only — server appends suffix) */}
      <div>
        <label htmlFor="username" className="mb-1 block text-sm font-semibold text-[#1c1b1a]">
          {t('form.username')}
        </label>
        <div className="flex items-stretch overflow-hidden rounded border border-[#d0c5af] focus-within:ring-2 focus-within:ring-[#735c00]">
          <input
            id="username"
            type="text"
            autoComplete="off"
            disabled={isSubmitting}
            placeholder="ada"
            className="flex-1 bg-white px-4 py-3 text-sm text-[#1c1b1a] placeholder-[#a89f8f] focus:outline-none"
            {...register('username', {
              required: t('form.errors.required'),
              maxLength: 64,
              pattern: slugPattern,
            })}
          />
          <span className="flex items-center bg-[#f9f8f7] px-3 text-sm text-[#605e5c]">
            @wendy
          </span>
        </div>
        <p className="mt-1 text-xs text-[#605e5c]">{t('form.usernameHint')}</p>
        {fieldError('username') && (
          <p className="mt-1 text-xs text-[#ba1a1a]">
            {fieldError('username')}
          </p>
        )}
      </div>

      {/* Phone (optional) */}
      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-semibold text-[#1c1b1a]">
          {t('form.phone')}{' '}
          <span className="text-xs font-normal text-[#605e5c]">
            {t('form.phoneOptional')}
          </span>
        </label>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          disabled={isSubmitting}
          className="w-full rounded border border-[#d0c5af] bg-white px-4 py-3 text-sm text-[#1c1b1a] placeholder-[#a89f8f] focus:outline-none focus:ring-2 focus:ring-[#735c00]"
          {...register('phone', { maxLength: 50 })}
        />
      </div>

      {/* Initial password */}
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-semibold text-[#1c1b1a]">
          {t('form.password')}
        </label>
        <div className="flex gap-2">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            disabled={isSubmitting}
            className="flex-1 rounded border border-[#d0c5af] bg-white px-4 py-3 text-sm text-[#1c1b1a] placeholder-[#a89f8f] focus:outline-none focus:ring-2 focus:ring-[#735c00]"
            {...register('password', {
              required: t('form.errors.required'),
              validate: (value) =>
                (value.length >= PASSWORD_LENGTH.MIN &&
                  value.length <= PASSWORD_LENGTH.MAX) ||
                t('form.errors.passwordLength'),
            })}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '🙈' : '👁'}
          </Button>
        </div>
        <p className="mt-1 text-xs text-[#605e5c]">{t('form.passwordHint')}</p>
        <p className="mt-1 text-xs text-[#605e5c]">
          {passwordLength} / {PASSWORD_LENGTH.MIN}-{PASSWORD_LENGTH.MAX}
          {passwordLength > 0 && !passwordInRange && (
            <span className="ml-2 text-[#ba1a1a]">
              {t('form.errors.passwordLength')}
            </span>
          )}
        </p>
        <Button
          type="button"
          variant="secondary"
          disabled={isSubmitting}
          onClick={handleGeneratePassword}
          className="mt-2"
        >
          🎲 {t('form.generatePassword')}
        </Button>
        {fieldError('password') && (
          <p className="mt-1 text-xs text-[#ba1a1a]">
            {fieldError('password')}
          </p>
        )}
      </div>

      {/* Banner error (non-field) */}
      {serverError && !serverError.field && (
        <div
          role="alert"
          className="rounded border-l-4 border-[#ba1a1a] bg-[#ffdad6] px-4 py-3 text-sm text-[#5a3535]"
        >
          {serverError.message}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          {t('form.cancel')}
        </Button>
        <Button
          type="submit"
          variant="default"
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? '⏳ …' : t('form.submit')}
        </Button>
      </div>
    </form>
  );
}