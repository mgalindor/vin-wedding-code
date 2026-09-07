import {
  isApiError,
  ApiError,
  extractTraceId,
  decodeJwtRoles,
  readPersistedAccessToken,
} from '@/shared/api/errors';

describe('shared/api/errors', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('isApiError narrows correctly', () => {
    const e = new ApiError(422, 'invalid', 'Nope');
    expect(isApiError(e)).toBe(true);
    expect(isApiError(new Error('boom'))).toBe(false);
    expect(isApiError(null)).toBe(false);
  });

  it('extractTraceId prefers the body, then the X-Trace-Id header', () => {
    const headers = new Headers({ 'X-Trace-Id': 'abc-123' });
    expect(extractTraceId({ traceId: 'body-trace' }, headers)).toBe('body-trace');
    expect(extractTraceId({}, headers)).toBe('abc-123');
    expect(extractTraceId(null, new Headers())).toBeUndefined();
  });

  it('decodeJwtRoles extracts the roles claim', () => {
    const header = btoa('{}');
    const payload = btoa(JSON.stringify({ roles: ['Administrator', 'EventOrganizer'] }));
    const token = `${header}.${payload}.signature`;
    expect(decodeJwtRoles(token)).toEqual(['Administrator', 'EventOrganizer']);
  });

  it('readPersistedAccessToken reads from localStorage', () => {
    window.localStorage.setItem('__deer_jwt__', 'TOKEN_X');
    expect(readPersistedAccessToken()).toBe('TOKEN_X');
  });

  it('readPersistedAccessToken returns null when empty', () => {
    expect(readPersistedAccessToken()).toBeNull();
  });
});
