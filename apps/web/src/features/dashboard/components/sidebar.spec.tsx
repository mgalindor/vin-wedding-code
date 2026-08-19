// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import type { TenantId, UserId, UserProfileDto } from '@wendy/contracts';
import { UserRole } from '@wendy/contracts';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, vi } from 'vitest';

import i18n from '@/i18n/config';
import { AuthProvider } from '@/shared/auth/auth-store';

import { Sidebar } from './sidebar';

const locationState = vi.hoisted(() => ({ currentPath: '/dashboard' }));
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: locationState.currentPath }),
}));

vi.mock('@/shared/auth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    state: {
      isAuthenticated: true,
      accessToken: 'token',
      user: {
        id: 'admin-1' as UserId,
        fullName: 'Site Admin',
        email: 'admin@wendy',
        role: UserRole.Administrator,
        tenantId: 'default' as TenantId,
      } satisfies UserProfileDto,
    },
    dispatch: vi.fn(),
  }),
  useLogout: () => ({ logout: vi.fn() }),
}));

function renderSidebar({ isAdmin }: { isAdmin: boolean }) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <Sidebar isAdmin={isAdmin} />
      </AuthProvider>
    </I18nextProvider>,
  );
}

describe('SectionSidebar — Admin Wedding Planners navigation (US-008 regression guard)', () => {
  it('renders the Wedding Planners sidebar entry for an Administrator', () => {
    renderSidebar({ isAdmin: true });
    expect(screen.getByText(/Wedding Planners/i)).toBeInTheDocument();
  });

  it('does not render the Wedding Planners sidebar entry for a Wedding Planner', () => {
    renderSidebar({ isAdmin: false });
    expect(screen.queryByText(/Wedding Planners/i)).not.toBeInTheDocument();
  });

  it('points the Wedding Planners link to the directory route, not the onboarding form', () => {
    locationState.currentPath = '/dashboard';
    renderSidebar({ isAdmin: true });
    const link = screen.getByText(/Wedding Planners/i).closest('a');
    expect(link).not.toBeNull();
    expect(link!.getAttribute('href')).toBe('/dashboard/wedding-planners');
    expect(link!.getAttribute('href')).not.toBe(
      '/dashboard/wedding-planners/onboard',
    );
  });

  it('highlights the Wedding Planners link when on the directory route', () => {
    locationState.currentPath = '/dashboard/wedding-planners';
    renderSidebar({ isAdmin: true });
    const link = screen.getByText(/Wedding Planners/i).closest('a');
    expect(link!.getAttribute('aria-current')).toBe('page');
  });

  it('highlights the Wedding Planners link when on the onboard sub-route', () => {
    locationState.currentPath = '/dashboard/wedding-planners/onboard';
    renderSidebar({ isAdmin: true });
    const link = screen.getByText(/Wedding Planners/i).closest('a');
    expect(link!.getAttribute('aria-current')).toBe('page');
  });

  it('does not highlight the Wedding Planners link when on the dashboard home', () => {
    locationState.currentPath = '/dashboard';
    renderSidebar({ isAdmin: true });
    const link = screen.getByText(/Wedding Planners/i).closest('a');
    expect(link!.getAttribute('aria-current')).toBeNull();
  });
});