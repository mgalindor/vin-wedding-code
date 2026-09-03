import { z } from 'zod';

import { ApiClient } from '@/shared/api/client';

describe('api/client', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    window.localStorage.clear();
  });

  function mockFetchOnce(body: unknown, init?: { status?: number; headers?: HeadersInit }) {
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: init?.headers,
      }),
    ) as unknown as typeof fetch;
  }

  it('prefixes every URL with /api/v1 and injects the bearer header', async () => {
    window.localStorage.setItem('__deer_jwt__', 'TOKEN');
    mockFetchOnce({ ok: true });
    const api = new ApiClient();
    await api.get('/users/me');
    const call = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call?.[0]).toBe('/api/v1/users/me');
    const headers = call?.[1]?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer TOKEN');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('throws a typed ApiError on non-2xx', async () => {
    mockFetchOnce({ code: 'invalid', message: 'Nope' }, { status: 422 });
    const api = new ApiClient();
    await expect(api.get('/x')).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
      code: 'invalid',
    });
  });

  it('returns undefined on 204', async () => {
    mockFetchOnce(undefined, { status: 204 });
    const api = new ApiClient();
    const res = await api.request('/x', { method: 'DELETE' });
    expect(res).toBeUndefined();
  });

  it('passes the parsed value through when the schema accepts', async () => {
    mockFetchOnce({ id: 'evt_1', name: 'Maya & Luis' });
    const api = new ApiClient();
    const schema = z.object({ id: z.string(), name: z.string() });
    const res = await api.request('/events/evt_1', { schema });
    expect(res).toEqual({ id: 'evt_1', name: 'Maya & Luis' });
  });

  it('throws an ApiError(500, schema_drift) when the schema rejects', async () => {
    mockFetchOnce({ id: 'evt_1' }, { headers: { 'X-Trace-Id': 'trace-abc' } });
    const api = new ApiClient();
    const schema = z.object({ id: z.string(), name: z.string() });
    await expect(api.request('/events/evt_1', { schema })).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      code: 'schema_drift',
      traceId: 'trace-abc',
    });
  });
});
