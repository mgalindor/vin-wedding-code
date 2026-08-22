/**
 * TC-505 (component): WeddingCard — US-011.
 *
 * Verifies the per-card rendering follows the design system:
 *  - The couple label is `<partner1> & <partner2>` exactly.
 *  - The status badge derives `Active` from
 *    `status='published' AND eventDate >= today`.
 *  - The card is a focusable button-like element ready to receive
 *    click / Enter / Space navigation.
 */
// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { WeddingDto } from '@wendy/contracts';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n/config';

import { WeddingCard } from './wedding-card';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

function wrap(node: React.ReactNode) {
  const qc = new QueryClient();
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>{node}</QueryClientProvider>
    </I18nextProvider>
  );
}

const baseWedding: WeddingDto = {
  id: 'w-test' as never,
  tenantId: 'default' as never,
  ownerUserId: 'wp-1' as never,
  partner1Name: 'Sofía Ramírez',
  partner2Name: 'Andrés López',
  startTime: '18:00',
  eventDate: '2099-01-01',
  venueName: 'Hacienda San Miguel',
  venueCity: 'CDMX',
  status: 'draft' as never,
  createdAt: '2026-08-19T12:00:00.000Z',
  createdByUserId: 'wp-1' as never,
  // US-010: added to WeddingDto with the read-by-id endpoint.
  updatedAt: '2026-08-19T12:00:00.000Z',
  updatedByUserId: 'wp-1' as never,
};

describe('TC-505: WeddingCard — US-011', () => {
  it('renders the couple names joined with " & "', () => {
    render(wrap(<WeddingCard wedding={baseWedding} />));
    expect(
      screen.getByText('Sofía Ramírez & Andrés López'),
    ).toBeInTheDocument();
  });

  it('renders the venue name + city', () => {
    render(wrap(<WeddingCard wedding={baseWedding} />));
    expect(
      screen.getByText('Hacienda San Miguel, CDMX'),
    ).toBeInTheDocument();
  });

  it('renders "Draft" for status=draft', () => {
    render(wrap(<WeddingCard wedding={baseWedding} />));
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders "Archived" for status=archived', () => {
    render(
      wrap(
        <WeddingCard
          wedding={{ ...baseWedding, status: 'archived' as never }}
        />,
      ),
    );
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('derives "Active" when status=published AND eventDate is in the future', () => {
    render(
      wrap(
        <WeddingCard
          wedding={{
            ...baseWedding,
            status: 'published' as never,
            eventDate: '2099-12-31',
          }}
        />,
      ),
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('treats published + past date as "Archived"', () => {
    render(
      wrap(
        <WeddingCard
          wedding={{
            ...baseWedding,
            status: 'published' as never,
            eventDate: '2020-01-01',
          }}
        />,
      ),
    );
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('exposes the card as a focusable button-like element', () => {
    render(wrap(<WeddingCard wedding={baseWedding} />));
    const card = screen.getByRole('button', {
      name: /Sofía Ramírez & Andrés López/i,
    });
    expect(card).toBeInTheDocument();
    expect(card.tabIndex).toBe(0);
  });
});
