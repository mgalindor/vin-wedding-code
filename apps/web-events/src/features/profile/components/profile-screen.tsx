import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, KeyRound, Languages, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { applyProfilePatch, useAuth, useUserInfo } from '@/shared/auth';
import { useApiClient, type UserProfile, type UserRole } from '@/shared/api';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, ErrorBanner, FieldShell, Input, Spinner } from '@/shared/ui';

interface ProfileForm {
  displayName: string;
  email: string;
  phone: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ROLE_TONE: Record<UserRole, 'gold' | 'neutral'> = {
  Administrator: 'gold',
  EventOrganizer: 'neutral',
};

/**
 * My profile screen. Two cards:
 *   1. Identity — visible to every role. Updates PATCH /users/me.
 *   2. Security — change password (any role).
 *
 * The username and roles are intentionally read-only (admins manage
 * roles; the username is the login handle and changing it would break
 * the user's local storage mirror).
 */
export function ProfileScreen(): React.ReactElement {
  const { t } = useTranslation(['profile', 'common']);
  const { state, dispatch } = useAuth();
  const api = useApiClient();
  const qc = useQueryClient();
  const { data, isLoading } = useUserInfo();

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const onSaveProfile = async (form: ProfileForm) => {
    await api.patch<UserProfile>(`/users/${data.id}`, form);
    applyProfilePatch(dispatch, form);
    void qc.invalidateQueries({ queryKey: ['oauth', 'userinfo', data.id] });
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-8 py-10">
      <header>
        <h1
          className="text-3xl font-bold tracking-tight text-[var(--color-on-surface)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('profile:title')}
        </h1>
        <p className="mt-1 max-w-xl text-sm text-[var(--color-secondary)]">
          {t('profile:subtitle')}
        </p>
      </header>

      <IdentityCard user={data} onSave={onSaveProfile} />

      <PasswordCard />

      <LanguageCard currentLocale={state.user ? '' : 'en'} />
    </div>
  );
}

function IdentityCard({
  user,
  onSave,
}: {
  user: UserProfile;
  onSave: (form: ProfileForm) => Promise<void>;
}) {
  const { t } = useTranslation(['profile', 'common']);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, errors },
  } = useForm<ProfileForm>({
    defaultValues: {
      displayName: user.displayName,
      email: user.email,
      phone: user.phone ?? '',
    },
  });

  useEffect(() => {
    reset({
      displayName: user.displayName,
      email: user.email,
      phone: user.phone ?? '',
    });
    setSaved(false);
  }, [user, reset]);

  const onSubmit = async (state: ProfileForm) => {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        displayName: state.displayName,
        email: state.email,
        phone: state.phone || '',
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{t('profile:sections.identity')}</CardTitle>
          <CardDescription>
            {user.username} · {user.roles.join(', ')}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <Badge key={role} tone={ROLE_TONE[role]}>
              {role}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <FieldShell label={t('profile:fields.displayName')} required>
            <Input {...register('displayName', { required: 'Required' })} />
          </FieldShell>
          <FieldShell label={t('profile:fields.email')} required>
            <Input type="email" {...register('email', { required: 'Required' })} />
          </FieldShell>
          <FieldShell label={t('profile:fields.phone')}>
            <Input type="tel" {...register('phone')} />
          </FieldShell>
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {Object.keys(errors).length > 0 && (
            <p className="text-xs text-destructive">Revisa los campos marcados</p>
          )}
          <div className="flex items-center justify-end gap-3">
            {saved && (
              <span className="flex items-center gap-1 text-xs text-[var(--color-status-confirmed-text)]">
                <Check className="h-3 w-3" /> {t('profile:actions.saved')}
              </span>
            )}
            <Button type="submit" disabled={!isDirty || saving}>
              <Save className="h-4 w-4" /> {saving ? t('common:actions.saving') : t('profile:actions.save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordCard() {
  const { t } = useTranslation(['profile', 'common']);
  const { state } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PasswordForm>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (state: PasswordForm) => {
    if (state.newPassword !== state.confirmPassword) {
      setError(t('profile:password.errors.match'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const token = (() => {
        if (typeof window === 'undefined') return null;
        return window.localStorage.getItem('__deer_jwt__');
      })();
      const raw = await fetch('/oauth/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: state.currentPassword,
          newPassword: state.newPassword,
        }),
        credentials: 'include',
      });
      if (!raw.ok) {
        const body = (await raw.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? 'Failed');
      }
      reset();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const newPwd = watch('newPassword');

  if (!state.user) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-[var(--color-primary)]" />
          <CardTitle>{t('profile:password.title')}</CardTitle>
        </div>
        <CardDescription>{t('profile:password.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <FieldShell label={t('profile:password.current')} required>
            <Input type="password" {...register('currentPassword', { required: 'Required' })} />
          </FieldShell>
          <FieldShell label={t('profile:password.next')} required error={errors.newPassword?.message}>
            <Input
              type="password"
              {...register('newPassword', {
                required: 'Required',
                minLength: { value: 8, message: t('profile:password.errors.length') },
              })}
            />
          </FieldShell>
          <FieldShell
            label={t('profile:password.confirm')}
            required
            error={
              newPwd && watch('confirmPassword') !== newPwd
                ? t('profile:password.errors.match')
                : undefined
            }
          >
            <Input type="password" {...register('confirmPassword', { required: 'Required' })} />
          </FieldShell>
          {error && <ErrorBanner>{error}</ErrorBanner>}
          <div className="flex items-center justify-end gap-3">
            {saved && (
              <span className="flex items-center gap-1 text-xs text-[var(--color-status-confirmed-text)]">
                <Check className="h-3 w-3" /> {t('profile:password.success')}
              </span>
            )}
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? t('common:actions.saving') : t('profile:actions.changePassword')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function LanguageCard({ currentLocale: _currentLocale }: { currentLocale: string }) {
  const { t, i18n } = useTranslation('profile');
  const current = (i18n.language?.startsWith('es') ? 'es' : 'en') as 'en' | 'es';
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-[var(--color-primary)]" />
          <CardTitle>{t('profile:sections.preferences')}</CardTitle>
        </div>
        <CardDescription>{t('profile:languageHelp')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="inline-flex overflow-hidden rounded-full border border-[var(--color-outline-variant)]">
          {(['en', 'es'] as const).map((lang, i) => (
            <button
              key={lang}
              type="button"
              onClick={() => {
                void i18n.changeLanguage(lang);
                if (typeof document !== 'undefined') {
                  document.cookie = `i18next=${lang}; path=/; max-age=${60 * 60 * 24 * 365}`;
                }
              }}
              aria-pressed={current === lang}
              className={
                'px-4 py-2 text-xs font-semibold uppercase tracking-wider ' +
                (current === lang
                  ? 'bg-[var(--color-on-surface)] text-white'
                  : 'bg-transparent text-[var(--color-secondary)] hover:text-[var(--color-primary)]') +
                (i > 0 ? ' border-l border-[var(--color-outline-variant)]' : '')
              }
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
