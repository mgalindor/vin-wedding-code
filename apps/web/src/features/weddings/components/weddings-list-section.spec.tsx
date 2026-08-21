/**
 * TC-506c (component): WeddingsListSection — US-011.
 *
 * Verifies the dashboard orchestrator:
 *  - starts every mount with the default filter (`all`), default
 *    sort (`date`), and empty search — regardless of any stale
 *    `sessionStorage` value that may have been left by a prior
 *    session. (US-011 v1.2.0 — filter/sort/search are NOT
 *    persisted across reloads.)
 *  - renders the empty-state placeholder card inside the grid
 *    when the user has zero weddings.
 *  - renders the no-matches placeholder card inside the grid
 *    when the server returns 0 items but `total > 0`.
 */
// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { UserRole } from '@wendy/contracts';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n/config';

import { WeddingsListSection } from './weddings-list-section';

vi.mock('../hooks/use-weddings-list', () => ({
  useWeddingsList: vi.fn(),
}));

import { useWeddingsList } from '../hooks/use-weddings-list';

function wrap(node: React.ReactNode) {
  const qc = new QueryClient();
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>{node}</QueryClientProvider>
    </I18nextProvider>
  );
}

describe('TC-506c: WeddingsListSection — US-011 (no persistence, in-grid empty card)', () => {
  beforeEach(() => {
    // Make sure no leftover from a previous run leaks in.
    window.sessionStorage.clear();
  });

  it('ignores stale sessionStorage and starts with the defaults', () => {
    // Simulate a previous session that left a non-default filter
    // in sessionStorage. The new orchestrator must NOT honour it.
    window.sessionStorage.setItem(
      'wendy.dashboard.list',
      JSON.stringify({ search: 'sof', status: 'active', sort: 'added' }),
    );

    // hasWeddings=true so the chrome (chips, sort, search) is mounted.
    vi.mocked(useWeddingsList).mockReturnValue({
      items: [{ id: 'w-1' } as never],
      total: 1,
      hasMore: false,
      isLoading: false,
      isError: false,
      error: null,
      loadMore: vi.fn(),
      refetch: vi.fn(),
    });

    render(wrap(<WeddingsListSection callerRole={UserRole.WeddingPlanner} />));

    // The default chip ("All") is highlighted by the
    // aria-pressed=true attribute.
    expect(
      screen.getByRole('button', { name: 'All' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Closest Wedding' }),
    ).toHaveAttribute('aria-pressed', 'true');

    // Search input is blank, not the stale "sof" value.
    const searchInput = screen.getByRole('searchbox') as HTMLInputElement;
    expect(searchInput.value).toBe('');
  });

  it('renders the in-grid empty card when the WP has zero weddings', async () => {
    vi.mocked(useWeddingsList).mockReturnValue({
      items: [],
      total: 0,
      hasMore: false,
      isLoading: false,
      isError: false,
      error: null,
      loadMore: vi.fn(),
      refetch: vi.fn(),
    });

    render(wrap(<WeddingsListSection callerRole={UserRole.WeddingPlanner} />));

    await waitFor(() => {
      expect(screen.getByTestId('list-empty-state')).toBeInTheDocument();
    });
    // The chrome (filter chips, sort, search) must still be visible —
    // the empty card replaces ONLY the data slot inside the grid.
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'All' }),
    ).toBeInTheDocument();
  });

  it('renders the in-grid no-matches card when the WP has weddings but the filter returns 0', async () => {
    vi.mocked(useWeddingsList).mockReturnValue({
      items: [],
      total: 3, // >0 — so the WP actually owns weddings
      hasMore: false,
      isLoading: false,
      isError: false,
      error: null,
      loadMore: vi.fn(),
      refetch: vi.fn(),
    });

    render(wrap(<WeddingsListSection callerRole={UserRole.WeddingPlanner} />));

    await waitFor(() => {
      expect(screen.getByTestId('list-no-matches-state')).toBeInTheDocument();
    });
    expect(screen.getByTestId('list-state-create-link')).toBeInTheDocument();
  });
});
