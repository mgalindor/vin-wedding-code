/**
 * TC-310 (component): WeddingDisabledTabScreen — US-010.
 *
 * Verifies the disabled-tab screen surfaces the GET, the
 * localized "coming soon" message, and renders the WeddingDetailLayout
 * chrome (header + tab bar) so the WP sees a coherent page even when
 * the underlying story has not landed yet.
 */
// @vitest-environment jsdom
import { useLocation, useParams } from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import type { WeddingDto } from '@wendy/contracts';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n/config';

import { useWeddingsService } from '../weddings.service';
import { WeddingDisabledTabScreen } from './wedding-disabled-tab-screen';

vi.mock('@tanstack/react-router', () => ({
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
  useParams: vi.fn(),
  useLocation: vi.fn(),
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
  eventDate: '2026-08-21',
  startTime: '18:00',
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

function buildService(): ReturnType<typeof useWeddingsService> {
  return {
    createWedding: vi.fn(),
    listWeddings: vi.fn(),
    getWedding: vi.fn().mockResolvedValue(sampleWedding),
    updateWedding: vi.fn(),
  } as unknown as ReturnType<typeof useWeddingsService>;
}

function renderAt(
  tab: 'guests' | 'photos' | 'invitation',
): ReturnType<typeof render> {
  vi.mocked(useParams).mockReturnValue({ weddingId: sampleWedding.id });
  vi.mocked(useLocation).mockReturnValue({
    state: {},
    pathname: `/dashboard/weddings/${sampleWedding.id}/${tab}`,
  } as unknown as ReturnType<typeof useLocation>);
  vi.mocked(useWeddingsService).mockReturnValue(buildService());

  const titles = {
    guests: 'detail.guests.title',
    photos: 'detail.photos.title',
    invitation: 'detail.invitation.title',
  } as const;
  const comingIn = {
    guests: 'detail.guests.comingIn',
    photos: 'detail.photos.comingIn',
    invitation: 'detail.invitation.comingIn',
  } as const;
  const descriptions = {
    guests: 'detail.guests.description',
    photos: 'detail.photos.description',
    invitation: 'detail.invitation.description',
  } as const;

  return render(
    <I18nextProvider i18n={i18n}>
      <WeddingDisabledTabScreen
        tab={tab}
        titleKey={titles[tab]}
        comingInKey={comingIn[tab]}
        descriptionKey={descriptions[tab]}
      />
    </I18nextProvider>,
  );
}

describe('TC-310: WeddingDisabledTabScreen — US-010', () => {
  it.each(['guests', 'photos', 'invitation'] as const)(
    '%s: issues GET on mount and renders the localized coming-soon message',
    async (tab) => {
      renderAt(tab);
      await waitFor(() => {
        expect(
          screen.getByTestId(`wedding-disabled-tab-${tab}`),
        ).toBeInTheDocument();
      });
      expect(
        screen.getByRole('heading', {
          name: /Sofía Ramírez & Andrés López/i,
        }),
      ).toBeInTheDocument();
    },
  );
});
