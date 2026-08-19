// @vitest-environment jsdom
// TC-301 (FE): WeddingPlannersLandingCard — directory smart wrapper (US-008).
//
// Verifies the four mutually-exclusive render branches the smart
// wrapper decides between on mount:
//   - loading: skeleton placeholder while the request is in flight.
//   - success with []: the original empty-state card (Rule 11).
//   - success with rows: the directory list with one row per WP.
//   - error: a localized banner above the section.
//
// The list component is responsible for its own row rendering;
// this test exercises the wrapper's decision logic, not the
// row internals (those are covered by tc-302-wedding-planners-list-row).
import { render, screen, waitFor } from '@testing-library/react';
import type { UserId, WeddingPlannerSummaryDto } from '@wendy/contracts';
import { UserRole } from '@wendy/contracts';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, vi } from 'vitest';

import i18n from '@/i18n/config';
import { AuthProvider } from '@/shared/auth/auth-store';

import { WeddingPlannersLandingCard } from './wedding-planners-landing-card';

// Mock the navigation hook — we only assert that the CTA wires to
// it, not that the navigate call lands on a real URL in jsdom.
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

// Mock the api-client so the test never reads the in-memory token
// from AuthContext; the wrapper only needs the service to resolve.
const listWeddingPlanners = vi.fn();
vi.mock('@/shared/api-client', () => ({
  useApiClient: () => ({
    get: listWeddingPlanners,
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
  }),
}));

function makeRow(overrides: Partial<WeddingPlannerSummaryDto>): WeddingPlannerSummaryDto {
  return {
    id: 'wp-1' as UserId,
    fullName: 'Ada Lovelace',
    email: 'ada@wendy',
    role: UserRole.WeddingPlanner,
    isDisabled: false,
    createdAt: '2026-08-17T10:00:00.000Z',
    ...overrides,
  };
}

function renderCard() {
  return render(
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <WeddingPlannersLandingCard />
      </AuthProvider>
    </I18nextProvider>,
  );
}

describe('TC-301: WeddingPlannersLandingCard — directory smart wrapper (US-008)', () => {
  it('shows the loading skeleton while the request is in flight, then resolves', async () => {
    let resolve!: (rows: never[]) => void;
    listWeddingPlanners.mockReturnValue(
      new Promise<never[]>((r) => {
        resolve = r;
      }),
    );

    renderCard();
    expect(screen.getByTestId('wedding-planners-loading')).toBeInTheDocument();

    // Now resolve so the pending promise doesn't keep the worker
    // alive after the test body returns.
    resolve([]);
    await waitFor(() => {
      expect(
        screen.getByTestId('wedding-planners-empty-state'),
      ).toBeInTheDocument();
    });
  });

  it('shows the empty-state card when the API returns [] (Rule 11)', async () => {
    listWeddingPlanners.mockResolvedValue([]);
    renderCard();
    await waitFor(() => {
      expect(
        screen.getByTestId('wedding-planners-empty-state'),
      ).toBeInTheDocument();
    });
  });

  it('shows the directory list when the API returns rows', async () => {
    listWeddingPlanners.mockResolvedValue([
      makeRow({}),
      makeRow({
        id: 'wp-2' as UserId,
        fullName: 'Grace Hopper',
        email: 'grace@wendy',
        isDisabled: true,
        createdAt: '2026-08-10T09:00:00.000Z',
      }),
    ]);

    renderCard();

    await waitFor(() => {
      expect(screen.getByTestId('wedding-planners-list')).toBeInTheDocument();
    });

    const rows = screen.getAllByTestId('wedding-planner-row');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent(/Ada Lovelace/);
    expect(rows[0]).toHaveAttribute('data-wp-disabled', 'false');
    expect(rows[1]).toHaveTextContent(/Grace Hopper/);
    expect(rows[1]).toHaveAttribute('data-wp-disabled', 'true');
  });

  it('shows the localized error banner when the request fails', async () => {
    listWeddingPlanners.mockRejectedValue(new Error('boom'));
    renderCard();
    await waitFor(() => {
      expect(screen.getByTestId('wedding-planners-error')).toBeInTheDocument();
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/boom/);
  });

  it('never shows the empty-state card and the list at the same time (Rule 11)', async () => {
    listWeddingPlanners.mockResolvedValue([makeRow({})]);

    renderCard();

    await waitFor(() => {
      expect(screen.getByTestId('wedding-planners-list')).toBeInTheDocument();
    });

    expect(
      screen.queryByTestId('wedding-planners-empty-state'),
    ).not.toBeInTheDocument();
  });
});