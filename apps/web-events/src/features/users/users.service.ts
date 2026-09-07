import { useMemo } from 'react';

import {
  useApiClient,
  type AdminUserSummary,
  type CreateUserRequest,
  type UpdateUserRequest,
  type UserRole,
} from '@/shared/api';

export interface ListUsersInput {
  q?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  size?: number;
}

export interface UsersPage {
  items: AdminUserSummary[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasMore: boolean;
}

export interface UsersService {
  listUsers(input?: ListUsersInput): Promise<UsersPage>;
  getUser(id: string): Promise<AdminUserSummary>;
  createUser(dto: CreateUserRequest): Promise<AdminUserSummary>;
  updateUser(id: string, dto: UpdateUserRequest): Promise<AdminUserSummary>;
  disableUser(id: string): Promise<void>;
  enableUser(id: string): Promise<void>;
  deleteUser(id: string): Promise<void>;
}

export function useUsersService(): UsersService {
  const api = useApiClient();

  return useMemo<UsersService>(
    () => ({
      listUsers(input = {}) {
        const search = new URLSearchParams();
        if (input.q) search.set('q', input.q);
        if (input.role) search.set('role', input.role);
        if (typeof input.isActive === 'boolean') {
          search.set('isActive', String(input.isActive));
        }
        search.set('page', String(input.page ?? 0));
        search.set('size', String(input.size ?? 20));
        return api
          .get<{ items: AdminUserSummary[]; total?: number; page?: number; size?: number; totalPages?: number; hasMore?: boolean }>(
            `/users?${search.toString()}`,
          )
          .then((r) => {
            const size = r.size ?? input.size ?? 20;
            const total = r.total ?? r.items.length;
            return {
              items: r.items ?? [],
              total,
              page: r.page ?? input.page ?? 0,
              size,
              totalPages: r.totalPages ?? 1,
              hasMore: r.hasMore ?? false,
            };
          });
      },
      getUser(id) {
        return api.get<AdminUserSummary>(`/users/${id}`);
      },
      createUser(dto) {
        return api.post<AdminUserSummary>('/users', dto);
      },
      updateUser(id, dto) {
        return api.patch<AdminUserSummary>(`/users/${id}`, dto);
      },
      disableUser(id) {
        return api.post<void>(`/users/${id}/disable`);
      },
      enableUser(id) {
        return api.post<void>(`/users/${id}/enable`);
      },
      deleteUser(id) {
        return api.delete<void>(`/users/${id}`);
      },
    }),
    [api],
  );
}
