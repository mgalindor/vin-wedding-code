/**
 * TC-308 (component): WeddingOverviewScreen — US-010.
 *
 * Verifies the Overview tab renders the GET-on-mount flow, the
 * captured fields, the countdown banner, the setup checklist,
 * the latest activity feed, and the public-links section. The
 * "Manage wedding data" navigation shortcut is also covered so
 * the WP can jump to the edit surface.
 */
// @vitest-environment jsdom
import { Link, useLocation, useParams } from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import type { WeddingDto } from '@wendy/contracts';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n/config';

import { useWeddingsService } from '../weddings.service';
import { WeddingOverviewScreen } from './wedding-overview-screen';

vi.mock('@tanstack/react-router', () => ({
  useParams: vi.fn(),
  useLocation: vi.fn(),
  Link: ({
    children,
    to,
    params,
    ...rest
  }: {
    children: React.ReactNode;
    to: string;
    params?: Record<string, string>;
    [k: string]: unknown;
  }) => {
    // Mirror TanStack Router's path interpolation (`/foo/$id/bar` →
    // `/foo/{id}/bar`) for the test's `to` values. Sufficient for the
    // assertions this file makes; full router interpolation lives in
    // the integration / E2E layer.
    const interpolated = Object.entries(params ?? {}).reduce(
      (acc, [key, value]) => acc.replace(`$${key}`, value),
      to,
    );
    return (
      <a href={interpolated} {...rest}>
        {children}
      </a>
    );
  },
}));
vi.mock('../weddings.service', () => ({
  useWeddingsService: vi.fn(),
}));

function buildService(overrides: Partial<{
  getWedding: ReturnType<typeof vi.fn>;
}> = {}) {
  return {
    createWedding: vi.fn(),
    listWeddings: vi.fn(),
    getWedding: vi.fn().mockResolvedValue(sampleWedding),
    updateWedding: vi.fn(),
    ...overrides,
  };
}

function renderAt(
  service: ReturnType<typeof buildService> = buildService(),
): ReturnType<typeof render> {
  vi.mocked(useParams).mockReturnValue({ weddingId: sampleWedding.id });
  vi.mocked(useLocation).mockReturnValue({
    state: {},
    pathname: `/dashboard/weddings/${sampleWedding.id}`,
  } as unknown as ReturnType<typeof useLocation>);
  vi.mocked(useWeddingsService).mockReturnValue(service as unknown as ReturnType<typeof useWeddingsService>);
  return render(
    <I18nextProvider i18n={i18n}>
      <WeddingOverviewScreen />
    </I18nextProvider>,
  );
}

const sampleWedding: WeddingDto = {
  id: 'abcd1234ef' as WeddingDto['id'],
  tenantId: 'default' as WeddingDto['tenantId'],
  ownerUserId: 'wp-1' as WeddingDto['ownerUserId'],
  partner1Name: 'Sofía Ramírez',
  partner2Name: 'Andrés López',
  // Far-future date so the "time until the wedding" countdown is the
  // expected state in the spec (vs. "days since" / "today").
  eventDate: '2099-08-21',
  startTime: '17:30',
  venueName: 'Hacienda San Miguel',
  venueCity: 'CDMX',
  status: 'draft' as WeddingDto['status'],
  createdAt: '2026-08-19T12:00:00.000Z',
  createdByUserId: 'wp-1' as WeddingDto['createdByUserId'],
  updatedAt: '2026-08-19T12:00:00.000Z',
  updatedByUserId: 'wp-1' as WeddingDto['createdByUserId'],
  // US-014a: empty locations list.
  locations: [],
};

describe('TC-308: WeddingOverviewScreen — US-010', () => {
  it('issues GET /weddings/{id} on mount and renders the captured fields', async () => {
    const service = buildService();
    renderAt(service);

    await waitFor(() => {
      expect(service.getWedding).toHaveBeenCalledWith(sampleWedding.id);
    });
    // The couple title now lives only in the breadcrumb + <h1> as
    // "Sofía Ramírez & Andrés López", so we assert it via the heading
    // role (matches both names joined by an ampersand).
    expect(
      screen.getByRole('heading', { name: /sofía ramírez.*andrés lópez/i }),
    ).toBeInTheDocument();
    // Venue + city are rendered together in the header subtitle and
    // again in the countdown banner — `getAllByText` to assert at
    // least one occurrence each.
    expect(screen.getAllByText(/hacienda san miguel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/cdmx/i).length).toBeGreaterThan(0);
  });

  it('renders a navigation shortcut to the Wedding Data tab', async () => {
    renderAt();
    await waitFor(() => {
      expect(screen.getByTestId('wedding-overview-go-to-data')).toBeInTheDocument();
    });
    expect(screen.getByTestId('wedding-overview-go-to-data').getAttribute('href')).toBe(
      `/dashboard/weddings/${sampleWedding.id}/data`,
    );
  });

  it('renders the countdown banner with days/hours/minutes', async () => {
    renderAt();
    await waitFor(() => {
      expect(screen.getByTestId('wedding-overview-countdown')).toBeInTheDocument();
    });
    expect(screen.getByText(/time until the wedding/i)).toBeInTheDocument();
    expect(screen.getAllByText(/days/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/hours/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/minutes/i).length).toBeGreaterThan(0);
  });

  it('renders the setup checklist, activity feed, and public-links section', async () => {
    renderAt();
    await waitFor(() => {
      expect(screen.getByTestId('wedding-overview-checklist')).toBeInTheDocument();
    });
    expect(screen.getByTestId('wedding-overview-activity')).toBeInTheDocument();
    expect(screen.getByTestId('wedding-overview-public-links')).toBeInTheDocument();
    expect(screen.getByText(/setup checklist/i)).toBeInTheDocument();
    expect(screen.getByText(/latest activity/i)).toBeInTheDocument();
    // "Public links" appears in the section header AND in the
    // "Public links go live..." coming-in note. Use the test-id-based
    // assertion (the previous line) to assert presence without
    // doubling on the description text.
  });

  it('renders the three public-link rows (invitation, album, couple upload)', async () => {
    renderAt();
    await waitFor(() => {
      expect(screen.getByTestId('wedding-overview-public-links')).toBeInTheDocument();
    });
    expect(screen.getByText(/public invitation/i)).toBeInTheDocument();
    expect(screen.getByText(/guest photo album/i)).toBeInTheDocument();
    expect(screen.getByText(/couple upload link/i)).toBeInTheDocument();
  });

  it('marks the published checklist item as pending for draft weddings', async () => {
    renderAt();
    await waitFor(() => {
      expect(screen.getByTestId('wedding-overview-checklist')).toBeInTheDocument();
    });
    // Draft wedding → the published checklist item shows the
    // "pending" copy, not the "Invitation published" copy.
    expect(screen.queryByText(/invitation published/i)).not.toBeInTheDocument();
  });
});
