/**
 * TC-309 (component): WeddingDataScreen — US-010.
 *
 * Verifies the Wedding Data tab renders an inline edit form (matching
 * the mockup surface) with:
 *   - The five captured fields pre-populated from GET /weddings/{id}.
 *   - A status chip in the card header that flips through
 *     `pristine → dirty → saving → saved → pristine` as the user
 *     edits, saves, and lets the brief confirmation window elapse.
 *   - The three placeholder sections for Locations / Event Program /
 *     Contacts that land with US-022/023.
 */
// @vitest-environment jsdom
import { useLocation, useParams } from '@tanstack/react-router';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { WeddingDto } from '@wendy/contracts';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n/config';

import { useWeddingsService } from '../weddings.service';
import { WeddingDataScreen } from './wedding-data-screen';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...rest }: { children: React.ReactNode; to: string; [k: string]: unknown }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useParams: vi.fn(),
  useLocation: vi.fn(),
  useNavigate: vi.fn(),
}));
vi.mock('../weddings.service', () => ({
  useWeddingsService: vi.fn(),
}));

const sampleWedding: WeddingDto = {
  id: 'abcd1234ef' as WeddingDto['id'],
  tenantId: 'default' as WeddingDto['tenantId'],
  ownerUserId: 'wp-1' as WeddingDto['ownerUserId'],
  partner1Name: 'Sofía Ramírez',
  partner2Name: 'Andrés López',
  // Far-future date so the past-date warning never triggers in the
  // test runner (the CI clock may be after 2026-08-21).
  eventDate: '2099-08-21',  startTime: '18:00',  venueName: 'Hacienda San Miguel',
  venueCity: 'CDMX',
  status: 'draft' as WeddingDto['status'],
  createdAt: '2026-08-19T12:00:00.000Z',
  createdByUserId: 'wp-1' as WeddingDto['createdByUserId'],
  updatedAt: '2026-08-19T12:00:00.000Z',
  updatedByUserId: 'wp-1' as WeddingDto['createdByUserId'],
};

function buildService(): ReturnType<typeof useWeddingsService> {
  return {
    createWedding: vi.fn(),
    listWeddings: vi.fn(),
    getWedding: vi.fn().mockResolvedValue(sampleWedding),
    updateWedding: vi.fn().mockResolvedValue({
      ...sampleWedding,
      partner2Name: 'James Williams',
    }),
  } as unknown as ReturnType<typeof useWeddingsService>;
}

function renderAt(
  service: ReturnType<typeof useWeddingsService> = buildService(),
): ReturnType<typeof useWeddingsService> {
  vi.mocked(useParams).mockReturnValue({ weddingId: sampleWedding.id });
  vi.mocked(useLocation).mockReturnValue({
    state: {},
    pathname: `/dashboard/weddings/${sampleWedding.id}/data`,
  } as unknown as ReturnType<typeof useLocation>);
  vi.mocked(useWeddingsService).mockReturnValue(service);
  render(
    <I18nextProvider i18n={i18n}>
      <WeddingDataScreen />
    </I18nextProvider>,
  );
  return service;
}

afterEach(() => {
  vi.clearAllMocks();
});


describe('TC-309: WeddingDataScreen — US-010', () => {
  it('renders the basic-information form pre-populated from the GET', async () => {
    renderAt();
    await waitFor(() => {
      expect(screen.getByTestId('wedding-data-basics')).toBeInTheDocument();
    });
    const card = screen.getByTestId('wedding-data-basics');
    expect(within(card).getByDisplayValue('Sofía Ramírez')).toBeInTheDocument();
    expect(within(card).getByDisplayValue('Andrés López')).toBeInTheDocument();
    expect(within(card).getByDisplayValue('Hacienda San Miguel')).toBeInTheDocument();
    expect(within(card).getByDisplayValue('CDMX')).toBeInTheDocument();
  });

  it('renders the three placeholder sections (Locations, Program, Contacts)', async () => {
    renderAt();
    await waitFor(() => {
      expect(screen.getByTestId('wedding-data-locations')).toBeInTheDocument();
    });
    expect(screen.getByTestId('wedding-data-program')).toBeInTheDocument();
    expect(screen.getByTestId('wedding-data-contacts')).toBeInTheDocument();
  });

  it('starts in the pristine "✓ Complete" state', async () => {
    renderAt();
    await waitFor(() => {
      const chip = screen.getByTestId('wedding-data-basics-chip');
      expect(chip).toHaveAttribute('data-state', 'pristine');
      expect(chip.textContent?.toLowerCase()).toContain('complete');
    });
  });

  it('flips the chip to "Save Changes" when a field is edited', async () => {
    renderAt();
    await waitFor(() => {
      expect(screen.getByTestId('wedding-data-basics-chip')).toBeInTheDocument();
    });
    const partner2 = screen.getByDisplayValue('Andrés López');
    fireEvent.change(partner2, { target: { value: 'James Williams' } });

    const chip = screen.getByTestId('wedding-data-basics-chip');
    expect(chip).toHaveAttribute('data-state', 'dirty');
    expect(chip.textContent?.toLowerCase()).toContain('save');
  });

  it('sends PATCH /weddings/{id} when the chip is clicked while dirty', async () => {
    const service = renderAt();
    await waitFor(() => {
      expect(screen.getByTestId('wedding-data-basics-chip')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue('Andrés López'), {
      target: { value: 'James Williams' },
    });

    // Use waitFor to grab the latest chip element after React has
    // re-rendered with data-state="dirty" AND the click handler
    // attached. Using `screen.getByTestId` inside waitFor is safer
    // than caching the node outside.
    await waitFor(() => {
      const c = screen.getByTestId('wedding-data-basics-chip');
      expect(c).toHaveAttribute('data-state', 'dirty');
    });

    fireEvent.click(screen.getByTestId('wedding-data-basics-chip'));

    await waitFor(() => {
      expect(service.updateWedding).toHaveBeenCalledWith(
        sampleWedding.id,
        expect.objectContaining({
          partner2Name: 'James Williams',
        }),
      );
    });
  });

  it('flips to "saved" then back to "pristine" after a successful save', async () => {
    // This test needs the real setTimeout to fire (the production
    // code uses a 1800ms confirmation window), so swap to real
    // timers for this case only.
    vi.useRealTimers();
    renderAt();
    await waitFor(() => {
      expect(screen.getByTestId('wedding-data-basics-chip')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByDisplayValue('Andrés López'), {
      target: { value: 'James Williams' },
    });
    fireEvent.click(screen.getByTestId('wedding-data-basics-chip'));
    await waitFor(() => {
      const chip = screen.getByTestId('wedding-data-basics-chip');
      expect(chip).toHaveAttribute('data-state', 'saved');
      expect(chip.textContent?.toLowerCase()).toContain('saved');
    });

    // Wait for the 1800ms confirmation window to elapse naturally.
    await new Promise((r) => setTimeout(r, 2000));
    const chipAfter = screen.getByTestId('wedding-data-basics-chip');
    expect(chipAfter).toHaveAttribute('data-state', 'pristine');
  });

  it('flips to the error state when the PATCH fails', async () => {
    const failingService = {
      createWedding: vi.fn(),
      listWeddings: vi.fn(),
      getWedding: vi.fn().mockResolvedValue(sampleWedding),
      updateWedding: vi.fn().mockRejectedValue(new Error('boom')),
    } as unknown as ReturnType<typeof useWeddingsService>;
    renderAt(failingService);
    await waitFor(() => {
      expect(screen.getByTestId('wedding-data-basics-chip')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByDisplayValue('Andrés López'), {
      target: { value: 'James Williams' },
    });
    const chip = await waitFor(() => {
      const c = screen.getByTestId('wedding-data-basics-chip');
      expect(c).toHaveAttribute('data-state', 'dirty');
      return c;
    });
    fireEvent.click(chip);

    await waitFor(() => {
      const c = screen.getByTestId('wedding-data-basics-chip');
      expect(c).toHaveAttribute('data-state', 'error');
    });
  });
});
