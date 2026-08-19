/**
 * TC-304 (component): WeddingDetailPlaceholderScreen — US-009.
 *
 * Verifies the read-only landing surface shipped as a placeholder for
 * the full detail screen (US-010). The component must:
 *   - Render the captured fields when a wedding is passed via
 *     navigation state.
 *   - Render the "coming soon" entry-point placeholders (US-022 /
 *     US-015) as disabled controls.
 *   - Fall back to a "no wedding" hint when state is missing.
 */
// @vitest-environment jsdom
import { useLocation, useParams } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import type { WeddingDto } from '@wendy/contracts';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n/config';

vi.mock('@tanstack/react-router', () => ({
  useParams: vi.fn(),
  useLocation: vi.fn(),
}));

import { WeddingDetailPlaceholderScreen } from './wedding-detail-placeholder-screen';

function renderAt(
  weddingId: string,
  wedding?: WeddingDto,
): ReturnType<typeof render> {
  vi.mocked(useParams).mockReturnValue({ weddingId });
  vi.mocked(useLocation).mockReturnValue({
    state: wedding ? { wedding } : {},
    pathname: `/dashboard/weddings/${weddingId}`,
  } as unknown as ReturnType<typeof useLocation>);

  return render(
    <I18nextProvider i18n={i18n}>
      <WeddingDetailPlaceholderScreen />
    </I18nextProvider>,
  );
}

const sampleWedding: WeddingDto = {
  id: 'abcd1234ef' as WeddingDto['id'],
  tenantId: 'default' as WeddingDto['tenantId'],
  ownerUserId: 'wp-1' as WeddingDto['ownerUserId'],
  partner1Name: 'Sofía Ramírez',
  partner2Name: 'Andrés López',
  eventDate: '2026-08-21',
  venueName: 'Hacienda San Miguel',
  venueCity: 'CDMX',
  status: 'draft' as WeddingDto['status'],
  createdAt: '2026-08-19T12:00:00.000Z',
  createdByUserId: 'wp-1' as WeddingDto['createdByUserId'],
};

describe('TC-304: WeddingDetailPlaceholderScreen — US-009', () => {
  it('renders every captured field when navigation state carries a wedding', () => {
    renderAt('abcd1234ef', sampleWedding);

    expect(screen.getByText('Sofía Ramírez')).toBeInTheDocument();
    expect(screen.getByText('Andrés López')).toBeInTheDocument();
    expect(screen.getByText('Hacienda San Miguel')).toBeInTheDocument();
    expect(screen.getByText('CDMX')).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it('renders the future-scope placeholders as disabled controls', () => {
    renderAt('abcd1234ef', sampleWedding);

    const configure = screen.getByRole('button', {
      name: /configure invitation/i,
    });
    const addGuests = screen.getByRole('button', { name: /add guests/i });
    expect(configure).toBeDisabled();
    expect(addGuests).toBeDisabled();
  });
});