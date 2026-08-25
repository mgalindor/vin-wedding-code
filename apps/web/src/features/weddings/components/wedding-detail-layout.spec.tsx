/**
 * TC-307 (component): WeddingDetailLayout — shared chrome for every
 * wedding-detail tab. Verifies the breadcrumb, the couple title +
 * wedding metadata + status badge, the five-tab bar with Overview
 * active by default, and the disabled state for the Guests / Photos /
 * Invitation tabs.
 */
// @vitest-environment jsdom
import { useLocation, useParams } from '@tanstack/react-router';
import { render, screen, within } from '@testing-library/react';
import type { WeddingDto } from '@wendy/contracts';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n/config';

import { WeddingDetailLayout } from './wedding-detail-layout';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...rest }: { children: React.ReactNode; to: string; [k: string]: unknown }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useParams: vi.fn(),
  useLocation: vi.fn(),
}));

function renderAt(
  activeTab: 'overview' | 'data' | 'guests' | 'photos' | 'invitation',
  weddingOverrides: Partial<WeddingDto> = {},
): ReturnType<typeof render> {
  const wedding: WeddingDto = {
    id: 'abcd1234ef' as WeddingDto['id'],
    tenantId: 'default' as WeddingDto['tenantId'],
    ownerUserId: 'wp-1' as WeddingDto['ownerUserId'],
    partner1Name: 'Sofía Ramírez',
    partner2Name: 'Andrés López',
    eventDate: '2026-08-21',
    startTime: '18:00',
    venueName: 'Hacienda San Miguel',
    venueCity: 'CDMX',
    status: 'draft' as WeddingDto['status'],
    createdAt: '2026-08-19T12:00:00.000Z',
    createdByUserId: 'wp-1' as WeddingDto['createdByUserId'],
    updatedAt: '2026-08-19T12:00:00.000Z',
    updatedByUserId: 'wp-1' as WeddingDto['createdByUserId'],  // US-014a: empty locations list by default; tests can override.
  locations: [],    ...weddingOverrides,
  };
  vi.mocked(useParams).mockReturnValue({ weddingId: wedding.id });
  vi.mocked(useLocation).mockReturnValue({
    state: {},
    pathname: `/dashboard/weddings/${wedding.id}`,
  } as unknown as ReturnType<typeof useLocation>);
  return render(
    <I18nextProvider i18n={i18n}>
      <WeddingDetailLayout wedding={wedding} activeTab={activeTab}>
        <div data-testid="tab-content" />
      </WeddingDetailLayout>
    </I18nextProvider>,
  );
}

describe('TC-307: WeddingDetailLayout — US-010', () => {
  it('renders the breadcrumb pointing to My Weddings', () => {
    renderAt('overview');
    const nav = screen.getByRole('navigation', { name: /my weddings/i });
    expect(nav).toBeInTheDocument();
    expect(within(nav).getByText(/My Weddings/i)).toBeInTheDocument();
    expect(within(nav).getByText(/Sofía Ramírez & Andrés López/i)).toBeInTheDocument();
  });

  it('renders the couple title, wedding date, venue and status badge', () => {
    renderAt('overview');
    expect(screen.getByRole('heading', { name: /Sofía Ramírez & Andrés López/i })).toBeInTheDocument();
    expect(screen.getByText(/Hacienda San Miguel, CDMX/)).toBeInTheDocument();
    expect(screen.getByText(/draft/i)).toBeInTheDocument();
  });

  it('renders the 5-tab bar with Overview / Wedding Data active when requested', () => {
    renderAt('overview');
    const tablist = screen.getByRole('tablist');
    expect(within(tablist).getByRole('tab', { name: /overview/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(within(tablist).getByRole('tab', { name: /wedding data/i })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('renders Overview as disabled when activeTab is data', () => {
    renderAt('data');
    const tablist = screen.getByRole('tablist');
    expect(within(tablist).getByRole('tab', { name: /overview/i })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    expect(within(tablist).getByRole('tab', { name: /wedding data/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('marks the Guests, Photos, and Invitation tabs as disabled', () => {
    renderAt('overview');
    const tablist = screen.getByRole('tablist');
    const guests = within(tablist).getByRole('tab', { name: /guests/i });
    const photos = within(tablist).getByRole('tab', { name: /photos/i });
    const invitation = within(tablist).getByRole('tab', { name: /invitation/i });
    expect(guests).toHaveAttribute('aria-disabled', 'true');
    expect(photos).toHaveAttribute('aria-disabled', 'true');
    expect(invitation).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders the tab content via children', () => {
    renderAt('overview');
    expect(screen.getByTestId('tab-content')).toBeInTheDocument();
  });

  it('renders the stats bar with four cards (guests / invitation / photos / guest-photos)', () => {
    renderAt('overview');
    expect(screen.getByTestId('wedding-stats-bar')).toBeInTheDocument();
    // Each card has a stable test-id; use it to avoid colliding with
    // the same labels in the tab bar.
    expect(screen.getByTestId('wedding-stats-card-guests')).toBeInTheDocument();
    expect(screen.getByTestId('wedding-stats-card-invitation')).toBeInTheDocument();
    expect(screen.getByTestId('wedding-stats-card-official-photos')).toBeInTheDocument();
    expect(screen.getByTestId('wedding-stats-card-guest-photos')).toBeInTheDocument();
    // Mockup seed numbers — replaced by live counters in US-021/022/030.
    expect(screen.getByText('112')).toBeInTheDocument();
    expect(screen.getByText(/14\/14/)).toBeInTheDocument();
  });
});
