// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import type { TenantId, UserId, UserProfileDto, WeddingDto } from '@wendy/contracts';
import { UserRole } from '@wendy/contracts';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, it, expect, vi } from 'vitest';

import i18n from '@/i18n/config';
import { AuthProvider } from '@/shared/auth/auth-store';

import { Sidebar } from './sidebar';

const routerState = vi.hoisted(() => ({
  currentPath: '/dashboard',
  currentWeddingId: '' as string,
}));
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: routerState.currentPath }),
  useParams: () => ({ weddingId: routerState.currentWeddingId }),
}));

const getWeddingSpy = vi.hoisted(() => vi.fn());
vi.mock('@/features/weddings/weddings.service', () => ({
  useWeddingsService: () => ({
    createWedding: vi.fn(),
    listWeddings: vi.fn(),
    getWedding: getWeddingSpy,
    updateWedding: vi.fn(),
  }),
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

const sampleWedding: WeddingDto = {
  id: 'w-current' as WeddingDto['id'],
  tenantId: 'default' as WeddingDto['tenantId'],
  ownerUserId: 'wp-1' as WeddingDto['ownerUserId'],
  partner1Name: 'Emma',
  partner2Name: 'James',
  startTime: null,
  eventDate: '2026-09-15',
  venueName: 'Gran SalÃ³n Montecarlo',
  venueCity: 'CDMX',
  status: 'published' as WeddingDto['status'],
  createdAt: '2026-08-19T12:00:00.000Z',
  createdByUserId: 'wp-1' as WeddingDto['createdByUserId'],
  updatedAt: '2026-08-19T12:00:00.000Z',
  updatedByUserId: 'wp-1' as WeddingDto['createdByUserId'],
};

function renderSidebar({ isAdmin }: { isAdmin: boolean }) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <Sidebar isAdmin={isAdmin} />
      </AuthProvider>
    </I18nextProvider>,
  );
}

describe('SectionSidebar â€” Admin Wedding Planners navigation (US-008 regression guard)', () => {
  it('renders the Wedding Planners sidebar entry for an Administrator', () => {
    routerState.currentPath = '/dashboard';
    routerState.currentWeddingId = '';
    getWeddingSpy.mockReset();
    renderSidebar({ isAdmin: true });
    expect(screen.getByText(/Wedding Planners/i)).toBeInTheDocument();
  });

  it('does not render the Wedding Planners sidebar entry for a Wedding Planner', () => {
    routerState.currentPath = '/dashboard';
    routerState.currentWeddingId = '';
    getWeddingSpy.mockReset();
    renderSidebar({ isAdmin: false });
    expect(screen.queryByText(/Wedding Planners/i)).not.toBeInTheDocument();
  });
});

describe('SectionSidebar â€” Current Wedding card (US-010)', () => {
  beforeEach(() => {
    routerState.currentPath = '/dashboard/weddings/w-current';
    routerState.currentWeddingId = 'w-current';
    getWeddingSpy.mockReset();
  });

  it('issues GET /weddings/{weddingId} when the URL contains a weddingId', async () => {
    getWeddingSpy.mockResolvedValue(sampleWedding);
    renderSidebar({ isAdmin: true });
    await waitFor(() => {
      expect(getWeddingSpy).toHaveBeenCalledWith('w-current');
    });
  });

  it('renders the Current Wedding card with couple + date when the GET resolves', async () => {
    getWeddingSpy.mockResolvedValue(sampleWedding);
    renderSidebar({ isAdmin: true });
    await waitFor(() => {
      expect(screen.getByTestId('sidebar-current-wedding')).toBeInTheDocument();
    });
    expect(screen.getByText(/Emma/)).toBeInTheDocument();
    expect(screen.getByText(/James/)).toBeInTheDocument();
    expect(screen.getByText(/Current Wedding/i)).toBeInTheDocument();
  });

  it('does not render the Current Wedding card on the dashboard index', () => {
    routerState.currentPath = '/dashboard';
    routerState.currentWeddingId = '';
    getWeddingSpy.mockReset();
    renderSidebar({ isAdmin: true });
    expect(
      screen.queryByTestId('sidebar-current-wedding'),
    ).not.toBeInTheDocument();
    expect(getWeddingSpy).not.toHaveBeenCalled();
  });

  it('does not render the Current Wedding card when the GET fails', async () => {
    getWeddingSpy.mockRejectedValue(new Error('boom'));
    renderSidebar({ isAdmin: true });
    await waitFor(() => {
      expect(getWeddingSpy).toHaveBeenCalled();
    });
    expect(
      screen.queryByTestId('sidebar-current-wedding'),
    ).not.toBeInTheDocument();
  });
});