import { Link, useLocation } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAuth, useLogout } from '@/shared/auth';
import { cn } from '@/shared/lib/utils';

interface NavItem {
  readonly to: string;
  readonly labelKey: string;
  readonly icon: React.ReactNode;
  readonly adminOnly?: boolean;
}

const WORKSPACE_ITEMS: ReadonlyArray<NavItem> = [
  {
    to: '/dashboard',
    labelKey: 'sidebar.weddings',
    icon: (
      <svg
        className="h-4 w-4 opacity-60"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <rect x="1" y="1" width="6" height="6" rx="1" />
        <rect x="9" y="1" width="6" height="6" rx="1" />
        <rect x="1" y="9" width="6" height="6" rx="1" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
      </svg>
    ),
  },
];

const ADMIN_ITEMS: ReadonlyArray<NavItem> = [
  {
    to: '/dashboard/wedding-planners/onboard',
    labelKey: 'sidebar.weddingPlanners',
    adminOnly: true,
    icon: (
      <svg
        className="h-4 w-4 opacity-60"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <circle cx="8" cy="4" r="2.5" />
        <path d="M3 14c0-3 2-5 5-5s5 2 5 5" />
      </svg>
    ),
  },
];

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    const first = parts[0] ?? '';
    return first.slice(0, 2).toUpperCase();
  }
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return `${first}${last}`.toUpperCase();
}

function isPathActive(currentPath: string, targetPath: string): boolean {
  if (targetPath === '/dashboard') {
    return currentPath === '/dashboard';
  }
  return currentPath.startsWith(targetPath);
}

export function Sidebar({
  isAdmin,
}: {
  isAdmin: boolean;
}): React.ReactElement {
  const { t } = useTranslation('dashboard');
  const { state } = useAuth();
  const { logout } = useLogout();
  const location = useLocation();

  const user = state.user;
  const initials = user ? getInitials(user.fullName) : '?';
  const fullName = user?.fullName ?? '';
  const role = user?.role ?? '';

  return (
    <aside
      className="flex w-60 shrink-0 flex-col border-r bg-[var(--color-surface-container-lowest)]"
      style={{ borderColor: 'var(--color-outline-variant)' }}
    >
      <div
        className="border-b px-5 py-6"
        style={{ borderColor: 'var(--color-outline-variant)' }}
      >
        <span
          className="block text-xl font-bold text-[var(--color-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('sidebar.brand')}
        </span>
        <span
          className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-secondary)]"
        >
          {t('sidebar.brandSub')}
        </span>
      </div>

      <nav className="flex flex-1 flex-col pt-4">
        <NavSection
          label={t('sidebar.workspace')}
          items={WORKSPACE_ITEMS}
          currentPath={location.pathname}
        />

        {isAdmin && (
          <NavSection
            label={t('sidebar.administration')}
            items={ADMIN_ITEMS}
            currentPath={location.pathname}
          />
        )}
      </nav>

      <div
        className="mt-auto border-t px-5 py-4"
        style={{ borderColor: 'var(--color-outline-variant)' }}
      >
        <div className="group/user flex items-center gap-2.5 px-2 py-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            style={{
              background: 'var(--color-primary-fixed)',
              color: 'var(--color-on-primary-fixed-variant)',
            }}
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-[var(--color-on-surface)]">
              {fullName}
            </div>
            <div className="text-[11px] text-[var(--color-secondary)]">
              {role}
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label={t('sidebar.logout')}
            title={t('sidebar.logout')}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--color-secondary)] opacity-50 transition-all hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)] hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavSection({
  label,
  items,
  currentPath,
}: {
  label: string;
  items: ReadonlyArray<NavItem>;
  currentPath: string;
}): React.ReactElement {
  const { t } = useTranslation('dashboard');
  return (
    <div className="pt-4">
      <span
        className="mb-1 block px-5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-secondary)]"
      >
        {label}
      </span>
      <ul className="m-0 list-none p-0">
        {items.map((item) => {
          const active = isPathActive(currentPath, item.to);
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 px-5 py-2 text-[13px] font-medium no-underline transition-colors',
                  active
                    ? 'border-l-2 border-[var(--color-primary)] bg-[var(--color-surface-container-low)] pl-[18px] font-semibold text-[var(--color-primary)]'
                    : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)]',
                )}
              >
                {item.icon}
                {t(item.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
