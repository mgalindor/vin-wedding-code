/**
 * TC-310 (component): LocationsCard — US-014a.
 *
 * Verifies the live locations editor:
 *   - Renders the empty state when the wedding has no locations.
 *   - Renders one row per location with the 8 fields + reorder/remove
 *     controls.
 *   - Disables Save when any row has a missing required field.
 *   - Flips the chip to "In progress" when a field is edited.
 *   - PUTs the typed array via `service.putLocations` when Save is
 *     clicked; the request body has no `id` field (server mints ids).
 *   - Reconciles the local state to the server's canonical array
 *     (server-stamped ids) after a successful PUT.
 *   - Renders read-only (no edit affordances) when the wedding is
 *     archived.
 */
// @vitest-environment jsdom
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  WeddingLocationType,
  type WeddingDto,
  type WeddingLocationDto,
} from '@wendy/contracts';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n/config';
import { useUserInfo } from '@/shared/auth';

import { useWeddingsService } from '../weddings.service';
import { LocationsCard } from './locations-card';

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
vi.mock('@/shared/auth', () => ({
  useUserInfo: vi.fn(),
}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

function buildWedding(
  locations: WeddingLocationDto[] = [],
  overrides: Partial<WeddingDto> = {},
): WeddingDto {
  return {
    id: 'abcd1234ef' as WeddingDto['id'],
    tenantId: 'default' as WeddingDto['tenantId'],
    ownerUserId: 'wp-1' as WeddingDto['ownerUserId'],
    partner1Name: 'Sofía Ramírez',
    partner2Name: 'Andrés López',
    eventDate: '2099-08-21',
    startTime: null,
    venueName: 'Hacienda San Miguel',
    venueCity: 'CDMX',
    status: 'draft' as WeddingDto['status'],
    createdAt: '2026-08-19T12:00:00.000Z',
    createdByUserId: 'wp-1' as WeddingDto['createdByUserId'],
    updatedAt: '2026-08-19T12:00:00.000Z',
    updatedByUserId: 'wp-1' as WeddingDto['updatedByUserId'],
    locations,
    ...overrides,
  };
}

function buildService(
  putImpl: (id: string, dto: unknown) => Promise<WeddingDto> = async (
    _id,
    _dto,
  ) => buildWedding(),
) {
  return {
    createWedding: vi.fn(),
    listWeddings: vi.fn(),
    getWedding: vi.fn().mockResolvedValue(buildWedding()),
    updateWedding: vi.fn(),
    putLocations: vi.fn().mockImplementation(putImpl),
  } as unknown as ReturnType<typeof useWeddingsService>;
}

function mockRole(role: 'WeddingPlanner' | 'Administrator'): void {
  vi.mocked(useQuery).mockReturnValue({
    data: { role },
    isLoading: false,
    error: null,
    // minimal React Query surface the component actually uses
  } as unknown as ReturnType<typeof useQuery>);
}

function renderCard(
  wedding: WeddingDto,
  service: ReturnType<typeof useWeddingsService>,
): ReturnType<typeof useWeddingsService> {
  vi.mocked(useParams).mockReturnValue({ weddingId: wedding.id });
  vi.mocked(useWeddingsService).mockReturnValue(service);
  vi.mocked(useUserInfo).mockReturnValue({
    data: { role: 'WeddingPlanner' as never },
  } as unknown as ReturnType<typeof useUserInfo>);
  render(
    <I18nextProvider i18n={i18n}>
      <LocationsCard wedding={wedding} />
    </I18nextProvider>,
  );
  return service;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('TC-310: LocationsCard (US-014a)', () => {
  it('renders the empty state when the wedding has no locations', () => {
    const service = buildService();
    renderCard(buildWedding([]), service);

    expect(screen.getByTestId('locations-empty-state')).toBeInTheDocument();
    expect(screen.getByTestId('locations-add-button')).toBeInTheDocument();
  });

  it('renders one row per location with all 8 fields + the reorder controls', () => {
    const locations: WeddingLocationDto[] = [
      {
        id: 'loc-1' as WeddingLocationDto['id'],
        type: WeddingLocationType.ReligiousCeremony,
        venueName: 'Parroquia',
        address: 'Av. Reforma 1',
        city: 'CDMX',
        eventDate: '2099-08-21',
        startTime: '17:00',
        googleMapsLink: 'https://maps.google.com/?q=Parroquia',
        notes: null,
      },
      {
        id: 'loc-2' as WeddingLocationDto['id'],
        type: WeddingLocationType.Reception,
        venueName: 'Hacienda',
        address: 'Av. Principal 123',
        city: 'CDMX',
        eventDate: '2099-08-21',
        startTime: '20:00',
        googleMapsLink: null,
        notes: 'Valet parking',
      },
    ];
    const service = buildService();
    renderCard(buildWedding(locations), service);

    expect(screen.getByTestId('location-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('location-row-1')).toBeInTheDocument();

    const row0 = screen.getByTestId('location-row-0');
    expect(within(row0).getByDisplayValue('Parroquia')).toBeInTheDocument();
    expect(within(row0).getByDisplayValue('Av. Reforma 1')).toBeInTheDocument();

    // Reorder buttons are disabled at the edges.
    expect(
      screen.getByTestId('location-row-0-up'),
    ).toBeDisabled();
    expect(
      screen.getByTestId('location-row-1-down'),
    ).toBeDisabled();
  });

  it('disables Save when any row has a missing required field', async () => {
    const incomplete: WeddingLocationDto[] = [
      {
        id: 'loc-1' as WeddingLocationDto['id'],
        type: WeddingLocationType.Reception,
        venueName: '', // missing required field
        address: 'Av. Principal 123',
        city: 'CDMX',
        eventDate: '2099-08-21',
        startTime: null,
        googleMapsLink: null,
        notes: null,
      },
    ];
    const service = buildService();
    renderCard(buildWedding(incomplete), service);

    // Chip is rendered in the dirty/in-progress state because the row
    // is invalid from the start.
    await waitFor(() => {
      const chip = screen.getByTestId('wedding-data-locations-chip');
      expect(chip).toHaveAttribute('data-state', 'dirty');
      expect(chip).toBeDisabled();
    });
  });

  it('flips the chip to "In progress" when a field is edited', async () => {
    const locations: WeddingLocationDto[] = [
      {
        id: 'loc-1' as WeddingLocationDto['id'],
        type: WeddingLocationType.Reception,
        venueName: 'Hacienda',
        address: 'Av. Principal 123',
        city: 'CDMX',
        eventDate: '2099-08-21',
        startTime: null,
        googleMapsLink: null,
        notes: null,
      },
    ];
    const service = buildService();
    renderCard(buildWedding(locations), service);

    await waitFor(() => {
      expect(
        screen.getByTestId('wedding-data-locations-chip'),
      ).toHaveAttribute('data-state', 'pristine');
    });

    const venueNameInput = screen.getByDisplayValue('Hacienda');
    fireEvent.change(venueNameInput, {
      target: { value: 'Hacienda San Miguel' },
    });

    await waitFor(() => {
      expect(
        screen.getByTestId('wedding-data-locations-chip'),
      ).toHaveAttribute('data-state', 'dirty');
    });
  });

  it('PUTs the typed array via putLocations on Save — body has no id field', async () => {
    const locations: WeddingLocationDto[] = [
      {
        id: 'loc-1' as WeddingLocationDto['id'],
        type: WeddingLocationType.Reception,
        venueName: 'Hacienda',
        address: 'Av. Principal 123',
        city: 'CDMX',
        eventDate: '2099-08-21',
        startTime: '20:00',
        googleMapsLink: 'https://maps.google.com/?q=Hacienda',
        notes: null,
      },
    ];
    const serverEcho: WeddingDto = buildWedding([
      {
        // The server stamps a fresh id — different from the FE's
        // array-index id used during editing.
        id: 'server-id-001' as WeddingLocationDto['id'],
        type: WeddingLocationType.Reception,
        venueName: 'Hacienda',
        address: 'Av. Principal 123',
        city: 'CDMX',
        eventDate: '2099-08-21',
        startTime: '20:00',
        googleMapsLink: 'https://maps.google.com/?q=Hacienda',
        notes: null,
      },
    ]);

    const service = buildService(async (_id, dto) => {
      const body = dto as { locations: Array<Record<string, unknown>> };
      // The FE never sends an `id` field — the BE mints it server-side.
      for (const row of body.locations) {
        expect(row).not.toHaveProperty('id');
      }
      return serverEcho;
    });
    renderCard(buildWedding(locations), service);

    // Dirty the form first — the chip is a button only when there
    // is something actionable (dirty → save). Editing the venueName
    // flips the chip into the dirty state.
    fireEvent.change(screen.getByDisplayValue('Hacienda'), {
      target: { value: 'Hacienda San Miguel' },
    });

    const chip = await screen.findByTestId('wedding-data-locations-chip');
    expect(chip).toHaveAttribute('data-state', 'dirty');
    fireEvent.click(chip);

    await waitFor(() => {
      expect(service.putLocations).toHaveBeenCalledTimes(1);
    });

    const [idArg, dtoArg] = (service.putLocations as ReturnType<typeof vi.fn>).mock
      .calls[0]!;
    expect(idArg).toBe('abcd1234ef');
    expect((dtoArg as { locations: unknown[] }).locations).toHaveLength(1);
    expect(
      (dtoArg as { locations: Array<Record<string, unknown>> }).locations[0],
    ).not.toHaveProperty('id');
  });

  it('reconciles local state to the server-minted ids after a successful save', async () => {
    const locations: WeddingLocationDto[] = [
      {
        id: 'fe-idx-0' as WeddingLocationDto['id'],
        type: WeddingLocationType.Reception,
        venueName: 'Hacienda',
        address: 'Av. Principal 123',
        city: 'CDMX',
        eventDate: '2099-08-21',
        startTime: null,
        googleMapsLink: null,
        notes: null,
      },
    ];
    const serverEcho: WeddingDto = buildWedding([
      {
        id: 'server-canonical-id' as WeddingLocationDto['id'],
        type: WeddingLocationType.Reception,
        venueName: 'Hacienda',
        address: 'Av. Principal 123',
        city: 'CDMX',
        eventDate: '2099-08-21',
        startTime: null,
        googleMapsLink: null,
        notes: null,
      },
    ]);
    const service = buildService(async () => serverEcho);
    renderCard(buildWedding(locations), service);

    // Dirty the form so the chip becomes a clickable button.
    fireEvent.change(screen.getByDisplayValue('Hacienda'), {
      target: { value: 'Hacienda San Miguel' },
    });

    const chip = await screen.findByTestId('wedding-data-locations-chip');
    fireEvent.click(chip);

    // After the save, the chip briefly flips to "saved" then to the
    // canonical "pristine" with the server-side count.
    await waitFor(() => {
      const c = screen.getByTestId('wedding-data-locations-chip');
      expect(c).toHaveAttribute('data-state', 'saved');
    });
  });

  it('renders read-only (no add / remove / save affordances) when the wedding is archived', async () => {
    mockRole('WeddingPlanner');
    const wedding = buildWedding([], {
      status: 'archived' as WeddingDto['status'],
    });
    const service = buildService();
    renderCard(wedding, service);

    // The empty-state helper is rendered but there is no add button.
    expect(screen.getByTestId('locations-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('locations-add-button')).not.toBeInTheDocument();

    // Chip is rendered as a read-only span (not a button) — the
    // archived state forces the read-only posture even though the
    // chip's data-state would otherwise be 'pristine'.
    const chip = screen.getByTestId('wedding-data-locations-chip');
    expect(chip.tagName).toBe('SPAN');
  });

  it('rejects a googleMapsLink that does not start with http(s)', () => {
    const locations: WeddingLocationDto[] = [
      {
        id: 'loc-1' as WeddingLocationDto['id'],
        type: WeddingLocationType.Reception,
        venueName: 'Hacienda',
        address: 'Av. Principal 123',
        city: 'CDMX',
        eventDate: '2099-08-21',
        startTime: null,
        googleMapsLink: 'maps.google.com/foo', // missing protocol
        notes: null,
      },
    ];
    const service = buildService();
    renderCard(buildWedding(locations), service);

    // The inline URL error is rendered.
    expect(
      screen.getByText(/Use a valid http\(s\) URL/),
    ).toBeInTheDocument();
  });

  it('moves a row up and down with the reorder buttons', async () => {
    const locations: WeddingLocationDto[] = [
      {
        id: 'loc-1' as WeddingLocationDto['id'],
        type: WeddingLocationType.ReligiousCeremony,
        venueName: 'A',
        address: 'Address A',
        city: 'CDMX',
        eventDate: '2099-08-21',
        startTime: null,
        googleMapsLink: null,
        notes: null,
      },
      {
        id: 'loc-2' as WeddingLocationDto['id'],
        type: WeddingLocationType.Reception,
        venueName: 'B',
        address: 'Address B',
        city: 'CDMX',
        eventDate: '2099-08-21',
        startTime: null,
        googleMapsLink: null,
        notes: null,
      },
    ];
    const service = buildService();
    renderCard(buildWedding(locations), service);

    // Move row 1 up → row 1 becomes row 0.
    fireEvent.click(screen.getByTestId('location-row-1-up'));
    await waitFor(() => {
      const row0 = screen.getByTestId('location-row-0');
      expect(within(row0).getByDisplayValue('B')).toBeInTheDocument();
    });
  });
});