// @vitest-environment jsdom
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { userScopedUserInfoKey } from '@/shared/auth/use-user-info';

const ADMIN_PROFILE = {
  id: 'admin-1',
  fullName: 'Site Admin',
  email: 'admin@wendy',
  role: 'Administrator',
  tenantId: 'default',
};

describe('userScopedUserInfoKey — per-user cache isolation', () => {
  it('produces distinct keys for distinct user ids', () => {
    expect(userScopedUserInfoKey('admin-1')).not.toEqual(
      userScopedUserInfoKey('wp-1'),
    );
  });

  it('produces a key distinct from the guest key when userId is null', () => {
    const adminKey = userScopedUserInfoKey('admin-1');
    const guestKey = userScopedUserInfoKey(null);
    expect(guestKey).not.toEqual(adminKey);
  });

  it('is referentially stable for the same userId', () => {
    expect(userScopedUserInfoKey('admin-1')).toEqual(
      userScopedUserInfoKey('admin-1'),
    );
  });
});

describe('useLogout — clears the React Query cache', () => {
  function seedAdminProfile(queryClient: QueryClient) {
    queryClient.setQueryData(['oauth', 'userinfo', 'admin-1'], ADMIN_PROFILE);
  }

  it('clear() empties a seeded cache', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    seedAdminProfile(queryClient);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(1);

    queryClient.clear();

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('logout() empties the cache the hook wraps', async () => {
    const { useLogout } = await import('@/shared/auth/use-logout');
    const { AuthProvider } = await import('@/shared/auth/auth-store');
    const { QueryClientProvider } = await import('@tanstack/react-query');
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    seedAdminProfile(queryClient);

    vi.stubGlobal('window', { localStorage: { removeItem: vi.fn() } });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useLogout(), { wrapper });
    await act(async () => {
      result.current.logout();
    });

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});