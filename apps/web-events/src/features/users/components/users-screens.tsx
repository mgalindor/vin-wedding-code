import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Power, Search, UserCog, UserPlus, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';

import type { CreateUserRequest, UserRole } from '@/shared/api';
import { useUsersService } from '@/features/users/users.service';
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  FieldShell,
  Input,
  Select,
  Spinner,
} from '@/shared/ui';

type RoleFilter = 'all' | UserRole;

const ROLE_TONE: Record<UserRole, 'gold' | 'neutral'> = {
  Administrator: 'gold',
  EventOrganizer: 'neutral',
};

const ROLE_OPTIONS: ReadonlyArray<UserRole> = ['EventOrganizer', 'Administrator'];

const PASSWORD_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generatePassword(length = 10): string {
  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += PASSWORD_ALPHABET[buf[i]! % PASSWORD_ALPHABET.length];
  }
  return out;
}

export function UsersListScreen(): React.ReactElement {
  const navigate = useNavigate();
  const { t } = useTranslation(['users', 'common']);
  const service = useUsersService();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');

  const users = useQuery({
    queryKey: ['users', { search, role }],
    queryFn: () =>
      service.listUsers({
        q: search || undefined,
        role: role === 'all' ? undefined : role,
        size: 50,
      }),
  });

  const toggle = useMutation({
    mutationFn: async (u: { id: string; isActive: boolean }) =>
      u.isActive ? service.disableUser(u.id) : service.enableUser(u.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-8 py-8" data-testid="users-list">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight text-[var(--color-on-surface)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('users:title')}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--color-secondary)]">
            {t('users:subtitle')}
          </p>
        </div>
        <Button onClick={() => navigate({ to: '/dashboard/users/new' })}>
          <UserPlus className="h-4 w-4" /> {t('users:actions.newPlanner')}
        </Button>
      </header>

      <Card>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative grow">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-secondary)]" />
              <Input
                placeholder={t('users:search.placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 max-w-md"
              />
            </div>
            <Select value={role} onChange={(e) => setRole(e.target.value as RoleFilter)} className="w-44">
              <option value="all">{t('users:filters.all')}</option>
              <option value="EventOrganizer">{t('users:filters.EventOrganizer')}</option>
              <option value="Administrator">{t('users:filters.Administrator')}</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {users.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !users.data || users.data.items.length === 0 ? (
        <EmptyState
          icon={<UserCog className="h-6 w-6" />}
          title={t('common:actions.empty')}
          action={
            <Button onClick={() => navigate({ to: '/dashboard/users/new' })}>
              {t('users:actions.newPlanner')}
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] shadow-[var(--shadow-card)]">
          <table className="w-full border-collapse" style={{ minWidth: 720 }}>
            <thead>
              <tr className="border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]">
                <Th>{t('users:table.name')}</Th>
                <Th>{t('users:table.email')}</Th>
                <Th>{t('users:table.role')}</Th>
                <Th>{t('users:table.status')}</Th>
                <Th className="text-right">{t('users:table.actions')}</Th>
              </tr>
            </thead>
            <tbody>
              {users.data.items.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-[var(--color-outline-variant)] transition-colors hover:bg-[var(--color-surface-container-low)]"
                >
                  <Td>
                    <div className="font-medium text-[var(--color-on-surface)]">
                      {u.displayName || u.username}
                    </div>
                    <div className="font-mono text-xs text-[var(--color-secondary)]">
                      {u.username}
                    </div>
                  </Td>
                  <Td>
                    <div className="text-xs">{u.email}</div>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <Badge key={r} tone={ROLE_TONE[r]}>
                          {t(`users:filters.${r}`, { defaultValue: r })}
                        </Badge>
                      ))}
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={u.isActive ? 'success' : 'danger'}>
                      {u.isActive ? t('users:status.active') : t('users:status.inactive')}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        toggle.mutate({ id: u.id, isActive: u.isActive })
                      }
                      data-testid={`user-toggle-${u.id}`}
                    >
                      <Power className="h-3.5 w-3.5" />
                      {u.isActive ? t('users:actions.disable') : t('users:actions.enable')}
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={
        'px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)] ' +
        (className ?? '')
      }
    >
      {children}
    </th>
  );
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td
      className={
        'px-4 py-3 text-sm text-[var(--color-on-surface)] ' + (className ?? '')
      }
    >
      {children}
    </td>
  );
}

export function NewUserScreen(): React.ReactElement {
  const navigate = useNavigate();
  const { t } = useTranslation(['users', 'common']);
  const service = useUsersService();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserRequest & { confirmPassword: string }>({
    defaultValues: {
      username: '',
      displayName: '',
      email: '',
      phone: '',
      password: '',
      roles: ['EventOrganizer'],
      confirmPassword: '',
    },
  });

  const watchedRoles = watch('roles') ?? [];

  const toggleRole = (role: UserRole, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...watchedRoles, role]))
      : watchedRoles.filter((r) => r !== role);
    setValue('roles', next, { shouldValidate: true, shouldDirty: true });
  };

  const handleGeneratePassword = () => {
    setValue('password', generatePassword(10), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const onSubmit = async (state: CreateUserRequest & { confirmPassword: string }) => {
    setSubmitting(true);
    setError(null);
    try {
      await service.createUser({
        username: state.username.trim(),
        displayName: state.displayName.trim(),
        email: state.email,
        phone: state.phone || undefined,
        password: state.password,
        roles: state.roles,
      });
      await qc.invalidateQueries({ queryKey: ['users'] });
      void navigate({ to: '/dashboard/users' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <header className="mb-8">
        <h1
          className="text-3xl font-bold tracking-tight text-[var(--color-on-surface)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('users:newUser.title')}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-secondary)]">
          {t('users:newUser.subtitle')}
        </p>
      </header>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-8 shadow-[var(--shadow-card)]"
        noValidate
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FieldShell label={t('users:newUser.fields.firstName')} required>
            <Input
              {...register('displayName', { required: 'Required' })}
              placeholder="Maria"
            />
          </FieldShell>
          <FieldShell label={t('users:newUser.fields.username')} required>
            <Input
              {...register('username', {
                required: 'Required',
                pattern: {
                  value: /^[a-z0-9._-]+$/,
                  message: t('users:newUser.errors.usernameFormat'),
                },
              })}
              placeholder="maria"
            />
            <p className="mt-1 text-xs text-[var(--color-secondary)]">
              → {t('common:actions.open')} <code className="font-mono">@deer</code>
            </p>
          </FieldShell>
          <FieldShell label={t('users:newUser.fields.email')}>
            <Input type="email" {...register('email')} />
          </FieldShell>
          <FieldShell label={t('users:newUser.fields.phone')}>
            <Input type="tel" {...register('phone')} />
          </FieldShell>
          <FieldShell label={t('users:newUser.fields.password')} required>
            <div className="flex items-stretch gap-2">
              <Input
                type="text"
                placeholder="Type or generate"
                className="grow font-mono tracking-wider"
                data-testid="new-user-password"
                {...register('password', {
                  required: 'Required',
                  minLength: { value: 8, message: t('users:newUser.errors.passwordLength') },
                })}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGeneratePassword}
                aria-label={t('users:newUser.actions.generatePassword')}
                title={t('users:newUser.actions.generatePassword')}
                data-testid="new-user-generate-password"
              >
                <Wand2 className="h-4 w-4" />
                {t('users:newUser.actions.generatePassword')}
              </Button>
            </div>
          </FieldShell>
          <FieldShell
            label={t('users:newUser.fields.roles')}
            required
            error={
              watchedRoles.length === 0
                ? t('users:newUser.errors.rolesRequired')
                : undefined
            }
          >
            <input type="hidden" {...register('roles')} />
            <div className="flex flex-col gap-2">
              {ROLE_OPTIONS.map((role) => {
                const checked = watchedRoles.includes(role);
                return (
                  <label
                    key={role}
                    className={
                      'flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm transition-colors ' +
                      (checked
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-fixed)]/30 text-[var(--color-on-surface)]'
                        : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface)] hover:border-[var(--color-primary-container)]')
                    }
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggleRole(role, e.target.checked)}
                      className="h-4 w-4 accent-[var(--color-primary)]"
                      data-testid={`new-user-role-${role}`}
                    />
                    <span className="font-medium">{t(`users:filters.${role}`)}</span>
                  </label>
                );
              })}
            </div>
          </FieldShell>
        </div>

        {error && (
          <div className="rounded border-l-4 border-destructive bg-error-container/40 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate({ to: '/dashboard/users' })}>
            {t('common:actions.cancel')}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? t('common:actions.saving') : t('users:actions.newPlanner')}
          </Button>
        </div>
      </form>
    </div>
  );
}
