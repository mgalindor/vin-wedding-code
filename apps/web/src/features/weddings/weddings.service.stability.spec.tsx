/**
 * TC-301 (regression): useWeddingsService reference stability.
 *
 * Pins the bug US-010 shipped before the memo fix landed: clicking
 * on a wedding card spammed `GET /weddings/{id}` until the browser
 * gave up because the hook returned a new object on every render.
 * With `useApiClient` + `useWeddingsService` both memoised on their
 * real dependencies (access token + api-client), the returned
 * service reference stays stable across renders that don't change
 * the auth state.
 */
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAuth } from '@/shared/auth';

import { useWeddingsService } from './weddings.service';

vi.mock('@/shared/auth', () => ({ useAuth: vi.fn() }));

// Hoisted so the references stay stable across renders — `vi.fn()`
// creates a NEW spy on every call, which would (legitimately)
// invalidate the useMemo on every render and break the test.
const STABLE_DISPATCH = vi.fn();

function mockAuth(): ReturnType<typeof useAuth> {
  return {
    state: {
      accessToken: 'tok-1',
      user: undefined,
    },
    dispatch: STABLE_DISPATCH,
  } as unknown as ReturnType<typeof useAuth>;
}

describe('TC-301: useWeddingsService reference stability — US-010 regression', () => {
  it('returns the same object reference across renders when auth state is unchanged', () => {
    vi.mocked(useAuth).mockReturnValue(mockAuth());

    const { result, rerender } = renderHook(() => useWeddingsService());
    const first = result.current;

    rerender();
    expect(result.current).toBe(first);

    rerender();
    expect(result.current).toBe(first);
  });

  it('exposes stable method references so effects with [service] deps do not refire', () => {
    // Property check: each method on the returned service must be the
    // SAME reference across renders. This is the property the bug
    // violated — every render produced a new wrapper object, so any
    // `useEffect(() => { ... service.x() }, [service])` would refire
    // on every render and loop.
    vi.mocked(useAuth).mockReturnValue(mockAuth());

    const { result, rerender } = renderHook(() => useWeddingsService());
    const first = result.current;

    rerender();
    const second = result.current;

    expect(second.createWedding).toBe(first.createWedding);
    expect(second.listWeddings).toBe(first.listWeddings);
    expect(second.getWedding).toBe(first.getWedding);
    expect(second.updateWedding).toBe(first.updateWedding);
  });
});
