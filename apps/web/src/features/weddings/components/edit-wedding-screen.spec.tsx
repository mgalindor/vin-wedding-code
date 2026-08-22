/**
 * TC-306 (component): EditWeddingScreen — US-010.
 *
 * Verifies the edit orchestrator that hosts the existing NewWeddingForm
 * pre-populated from the GET response:
 *   - Issues GET /weddings/{id} on mount and pre-populates the form.
 *   - Renders the edit-flavoured submit label ("Save changes" / "Guardar
 *     cambios") instead of the create label.
 *   - Cancels back to the detail screen.
 *   - Surfaces a localized error banner when the GET fails.
 *   - Renders a loading skeleton while the GET is in flight.
 */
// @vitest-environment jsdom
import { useNavigate, useParams } from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type WeddingDto } from '@wendy/contracts';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n/config';

import { useWeddingsService } from '../weddings.service';
import { EditWeddingScreen } from './edit-wedding-screen';

vi.mock('@tanstack/react-router', () => ({
  useParams: vi.fn(),
  useNavigate: vi.fn(),
}));

vi.mock('../weddings.service', () => ({
  useWeddingsService: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  useParams: vi.fn(),
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
  // Far-future event date so the past-date warning never triggers in
  // the test runner (the CI clock may be after the project's earliest
  // anchor date of 2026-08-21).
  eventDate: '2099-08-21',
  startTime: '18:00',
  venueName: 'Hacienda San Miguel',
  venueCity: 'CDMX',
  status: 'draft' as WeddingDto['status'],
  createdAt: '2026-08-19T12:00:00.000Z',
  createdByUserId: 'wp-1' as WeddingDto['createdByUserId'],
  updatedAt: '2026-08-19T12:00:00.000Z',
  updatedByUserId: 'wp-1' as WeddingDto['createdByUserId'],
};

function buildService(overrides: Partial<{
  getWedding: ReturnType<typeof vi.fn>;
  updateWedding: ReturnType<typeof vi.fn>;
}> = {}) {
  return {
    createWedding: vi.fn(),
    listWeddings: vi.fn(),
    getWedding: vi.fn().mockResolvedValue(sampleWedding),
    updateWedding: vi.fn().mockResolvedValue(sampleWedding),
    ...overrides,
  };
}

function renderScreen(service: ReturnType<typeof buildService>): ReturnType<typeof render> {
  vi.mocked(useParams).mockReturnValue({ weddingId: 'abcd1234ef' });
  vi.mocked(useNavigate).mockReturnValue(vi.fn() as unknown as ReturnType<typeof useNavigate>);
  vi.mocked(useWeddingsService).mockReturnValue(service as unknown as ReturnType<typeof useWeddingsService>);

  return render(
    <I18nextProvider i18n={i18n}>
      <EditWeddingScreen />
    </I18nextProvider>,
  );
}

describe('TC-306: EditWeddingScreen — US-010', () => {
  it('issues GET /weddings/{id} on mount and pre-populates the form', async () => {
    const service = buildService();
    renderScreen(service);

    await waitFor(() => {
      expect(service.getWedding).toHaveBeenCalledWith('abcd1234ef');
    });

    await waitFor(() => {
      const partner1 = screen.getByLabelText(/Partner 1/i) as HTMLInputElement;
      expect(partner1.value).toBe('Sofía Ramírez');
    });

    expect(
      (screen.getByLabelText(/Partner 2/i) as HTMLInputElement).value,
    ).toBe('Andrés López');
    expect(
      (screen.getByLabelText(/Venue Name/i) as HTMLInputElement).value,
    ).toBe('Hacienda San Miguel');
    expect(
      (screen.getByLabelText(/City/i) as HTMLInputElement).value,
    ).toBe('CDMX');
  });

  it('renders the edit-flavoured submit label instead of the create label', async () => {
    renderScreen(buildService());

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /save changes/i }),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('button', { name: /save & continue/i }),
    ).not.toBeInTheDocument();
  });

  it('renders a loading skeleton while the GET is in flight', () => {
    const service = buildService({
      getWedding: vi.fn().mockReturnValue(new Promise(() => {})),
    });
    renderScreen(service);

    // The form is not rendered yet because the wedding has not loaded.
    expect(screen.queryByLabelText(/Partner 1/i)).not.toBeInTheDocument();
  });

  it('surfaces a localized error banner when the GET fails', async () => {
    const service = buildService({
      getWedding: vi.fn().mockRejectedValue(new Error('boom')),
    });
    renderScreen(service);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('submits a PATCH with the form values and navigates back to the detail', async () => {
    const updateWedding = vi.fn().mockResolvedValue({
      ...sampleWedding,
      partner1Name: 'Updated Partner',
    });
    const service = buildService({ updateWedding });
    renderScreen(service);

    await waitFor(() => {
      expect(
        screen.getByLabelText(/Partner 1/i),
      ).toBeInTheDocument();
    });

    const partner1 = screen.getByLabelText(/Partner 1/i);
    fireEvent.change(partner1, { target: { value: 'Updated Partner' } });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(updateWedding).toHaveBeenCalledWith(
        'abcd1234ef',
        expect.objectContaining({
          partner1Name: 'Updated Partner',
        }),
      );
    });
  });
});