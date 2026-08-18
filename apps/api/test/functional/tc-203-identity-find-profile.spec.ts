/**
 * TC-203 (backend): IdentityService.findProfile.
 *
 * - Returns the profile shape (without password_hash) for an existing user.
 * - Throws NotFoundException when the user is missing OR disabled.
 */
import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, vi } from 'vitest';

import { IdentityService } from '../../src/modules/identity/application/identity.service';

describe('TC-203: IdentityService.findProfile', () => {
  const makeService = (repo: any) =>
    new IdentityService(repo, { findSuffixByTenantId: vi.fn() } as any);

  it('returns the profile when the user exists and is enabled', async () => {
    const repo = {
      findProfileById: vi.fn().mockResolvedValue({
        id: 'admin-1',
        tenant_id: 'default',
        email: 'admin@wendy',
        full_name: 'Site Admin',
        role: 'Administrator',
        is_disabled: false,
      }),
    };

    const profile = await makeService(repo).findProfile('admin-1' as any);

    expect(profile).toEqual({
      id: 'admin-1',
      fullName: 'Site Admin',
      email: 'admin@wendy',
      role: 'Administrator',
      tenantId: 'default',
    });
  });

  it('throws NotFoundException when the user is missing', async () => {
    const repo = { findProfileById: vi.fn().mockResolvedValue(null) };
    await expect(
      makeService(repo).findProfile('ghost' as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when the user is disabled', async () => {
    const repo = {
      findProfileById: vi.fn().mockResolvedValue({
        id: 'wp-1',
        tenant_id: 'default',
        email: 'wp@wendy',
        full_name: 'Disabled',
        role: 'WeddingPlanner',
        is_disabled: true,
      }),
    };
    await expect(
      makeService(repo).findProfile('wp-1' as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});