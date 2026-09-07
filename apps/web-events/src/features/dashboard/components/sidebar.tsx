import { Link, useLocation, useRouter } from '@tanstack/react-router';
import {
  CalendarHeart,
  CircleUser,
  LogOut,
  Settings2,
  Sparkles,
  UserCog,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAuth, useIsAdmin, useLogout } from '@/shared/auth';
import { cn } from '@/shared/lib/utils';

import type { ComponentType } from 'react';

interface NavItem {
  readonly to: string;
  readonly labelKey: string;
  readonly icon: ComponentType<{ className?: string }>;
  readonly adminOnly?: boolean;
}

const WORKSPACE_ITEMS: ReadonlyArray<NavItem> = [
  {
    to: '/dashboard',
    labelKey: 'nav.events',
    icon: CalendarHeart,
  },
  {
    to: '/dashboard/events/new',
    labelKey: 'nav.newEvent',
    icon: Sparkles,
  },
  {
    to: '/dashboard/profile',
    labelKey: 'nav.profile',
    icon: CircleUser,
  },
];

const ADMIN_ITEMS: ReadonlyArray<NavItem> = [
  {
    to: '/dashboard/users',
    labelKey: 'nav.users',
    adminOnly: true,
    icon: UserCog,
  },
];

function isPathActive(currentPath: string, targetPath: string): boolean {
  if (targetPath === '/dashboard') {
    return currentPath === '/dashboard';
  }
  return currentPath.startsWith(targetPath);
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return (parts[0] ?? '').slice(0, 2).toUpperCase();
  const first = (parts[0]?.[0] ?? '').toUpperCase();
  const last = (parts[parts.length - 1]?.[0] ?? '').toUpperCase();
  return `${first}${last}`;
}

export function Sidebar(): React.ReactElement {
  const { t } = useTranslation('dashboard');
  const { state } = useAuth();
  const { logout } = useLogout();
  const router = useRouter();
  const location = useLocation();
  const isAdmin = useIsAdmin();

  const displayName = state.user?.displayName ?? '';
  const username = state.user?.username ?? '';
  const initials = getInitials(displayName || username);

  const roleLabel = isAdmin ? t('role.admin') : t('role.organizer');

  return (
    <aside
      className="flex w-60 shrink-0 flex-col border-r border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]"
    >
      {/* Brand */}
      <div className="border-b border-[var(--color-outline-variant)] px-5 py-6">
        <div className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 40 40" aria-hidden>
            <circle cx="20" cy="20" r="18" stroke="#735c00" strokeWidth="1.5" fill="none" />
            <path
              d="M14 26c2-3 4-5 6-5s4 2 6 5"
              stroke="#735c00"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="15" cy="16" r="1.4" fill="#735c00" />
            <circle cx="25" cy="16" r="1.4" fill="#735c00" />
          </svg>
          <div>
            <span
              className="block text-lg font-bold leading-none text-[var(--color-primary)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('brand.title')}
            </span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)]">
              {t('brand.subtitle')}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto pt-4">
        <NavSection
          label={t('nav.sections.workspace')}
          items={WORKSPACE_ITEMS}
          currentPath={location.pathname}
        />

        {isAdmin && (
          <NavSection
            label={t('nav.sections.administration')}
            items={ADMIN_ITEMS}
            currentPath={location.pathname}
          />
        )}

        {/* Contextual help link — points at the user's profile page; a dedicated
         * help route is out of MVP scope and would otherwise 404 in prod. */}
        <div className="mt-auto px-5 pb-4 pt-8">
          <Link
            to="/dashboard/profile"
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-[var(--color-secondary)] no-underline transition-colors hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)]"
          >
            <Settings2 className="h-4 w-4 opacity-70" aria-hidden />
            {t('nav.help')}
          </Link>
        </div>
      </nav>

      {/* User footer card */}
      <div className="border-t border-[var(--color-outline-variant)] px-4 py-4">
        <Link
          to="/dashboard/profile"
          className="group/user flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-[var(--color-surface-container-low)]"
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            style={{
              background: 'var(--color-primary-container)',
              color: 'var(--color-on-primary-container)',
            }}
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-[var(--color-on-surface)]">
              {displayName || username || 'Account'}
            </div>
            <div className="truncate text-[11px] text-[var(--color-secondary)]">
              {roleLabel} · {username}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void logout();
              void router.navigate({ to: '/login' });
            }}
            aria-label={t('nav.logout')}
            title={t('nav.logout')}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--color-secondary)] opacity-50 transition-all hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)] hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </Link>
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
    <div className="pt-2">
      <span className="mb-1 block px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)]">
        {label}
      </span>
      <ul className="m-0 list-none p-0">
        {items.map((item) => {
          const active = isPathActive(currentPath, item.to);
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 px-5 py-2 text-[13px] font-medium no-underline transition-colors',
                  active
                    ? 'border-l-2 border-[var(--color-primary)] bg-[var(--color-surface-container-low)] pl-[18px] font-semibold text-[var(--color-primary)]'
                    : 'border-l-2 border-transparent text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)]',
                )}
              >
                <Icon className="h-4 w-4 opacity-60" />
                {t(item.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* Exposed so future sprints can add an "All events" quick switcher
 * (admin-only) without touching the nav-item array shape. */
export const _SidebarInternal = {} as const;
