/**
 * TC-305 (component / service): useWeddingsService — US-009.
 *
 * Verifies the FE service wraps the api-client correctly: the
 * `createWedding` call delegates to `POST /weddings` and returns the
 * typed `WeddingDto` payload.
 */
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useApiClient } from '@/shared/api-client';
import { useAuth } from '@/shared/auth';

import { useWeddingsService } from './weddings.service';

vi.mock('@/shared/auth', () => ({ useAuth: vi.fn() }));
vi.mock('@/shared/api-client', () => ({ useApiClient: vi.fn() }));

describe('TC-305: useWeddingsService — US-009', () => {
  it('calls POST /weddings with the create dto and returns the typed response', async () => {
    const post = vi.fn().mockResolvedValue({
      id: 'abcd1234ef',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'Sofía Ramírez',
      partner2Name: 'Andrés López',
      eventDate: '2026-08-21',
      venueName: 'Hacienda',
      venueCity: 'CDMX',
      status: 'draft',
      createdAt: '2026-08-19T12:00:00.000Z',
      createdByUserId: 'wp-1',
    });

    vi.mocked(useAuth).mockReturnValue({
      state: { accessToken: 'tok' },
      dispatch: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(useApiClient).mockReturnValue({
      request: vi.fn(),
      get: vi.fn(),
      post,
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReturnType<typeof useApiClient>);

    const { result } = renderHook(() => useWeddingsService());

    const dto = {
      partner1Name: 'Sofía Ramírez',
      partner2Name: 'Andrés López',
      eventDate: '2026-08-21',
      venueName: 'Hacienda',
      venueCity: 'CDMX',
    };

    const response = await result.current.createWedding(dto);

    expect(post).toHaveBeenCalledWith('/weddings', dto);
    expect(response.id).toBe('abcd1234ef');
    expect(response.status).toBe('draft');
  });
});