/**
 * TC-202 (backend): IdentityService.onboardWeddingPlanner — conflicts.
 *
 * Verifies that uniqueness checks fire BEFORE the row is written,
 * surfacing field-level errors to the inbound adapter:
 *   - email already in use
 *   - composed username already in use
 *   - self-onboarding via slug
 *   - self-onboarding via email
 */
import { describe, it, expect, vi } from 'vitest';

import { IdentityService } from '../../src/modules/identity/application/identity.service';

const basePrincipal = { actorId: 'admin-1', tenantId: 'default' };
const baseInput = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada.lovelace@example.com',
  username: 'ada',
  password: 'a-strong-passphrase',
};

describe('TC-202: IdentityService.onboardWeddingPlanner — conflicts', () => {
  it('rejects when email already exists (Rule 7)', async () => {
    const userRepository = {
      findProfileById: vi.fn().mockResolvedValue({
        id: 'admin-1',
        tenant_id: 'default',
        email: 'admin@wendy',
        full_name: 'Site Admin',
        role: 'Administrator',
        is_disabled: false,
      }),
      findIdByEmail: vi.fn(async (email: string) =>
        email === 'ada.lovelace@example.com' ? { id: 'existing' } : null,
      ),
      createWeddingPlanner: vi.fn(),
    };
    const tenantSuffixProvider = {
      findSuffixByTenantId: vi.fn().mockResolvedValue('wendy'),
    };

    const service = new IdentityService(
      userRepository as any,
      tenantSuffixProvider as any,
    );

    await expect(
      service.onboardWeddingPlanner(basePrincipal, baseInput),
    ).rejects.toMatchObject({ name: 'ConflictError', field: 'email' });

    expect(userRepository.createWeddingPlanner).not.toHaveBeenCalled();
  });

  it('rejects when composed username already exists (Rule 7)', async () => {
    const userRepository = {
      findProfileById: vi.fn().mockResolvedValue({
        id: 'admin-1',
        tenant_id: 'default',
        email: 'admin@wendy',
        full_name: 'Site Admin',
        role: 'Administrator',
        is_disabled: false,
      }),
      findIdByEmail: vi.fn(async (email: string) =>
        email === 'ada@wendy' ? { id: 'existing' } : null,
      ),
      createWeddingPlanner: vi.fn(),
    };
    const tenantSuffixProvider = {
      findSuffixByTenantId: vi.fn().mockResolvedValue('wendy'),
    };

    const service = new IdentityService(
      userRepository as any,
      tenantSuffixProvider as any,
    );

    await expect(
      service.onboardWeddingPlanner(basePrincipal, baseInput),
    ).rejects.toMatchObject({ name: 'ConflictError', field: 'username' });

    expect(userRepository.createWeddingPlanner).not.toHaveBeenCalled();
  });

  it('rejects self-onboarding by slug (Rule 8)', async () => {
    const userRepository = {
      findProfileById: vi.fn().mockResolvedValue({
        id: 'admin-1',
        tenant_id: 'default',
        email: 'admin@wendy',
        full_name: 'Site Admin',
        role: 'Administrator',
        is_disabled: false,
      }),
      findIdByEmail: vi.fn().mockResolvedValue(null),
      createWeddingPlanner: vi.fn(),
    };
    const tenantSuffixProvider = {
      findSuffixByTenantId: vi.fn().mockResolvedValue('wendy'),
    };

    const service = new IdentityService(
      userRepository as any,
      tenantSuffixProvider as any,
    );

    await expect(
      service.onboardWeddingPlanner(basePrincipal, {
        ...baseInput,
        username: 'admin',
        email: 'someone-else@example.com',
      }),
    ).rejects.toMatchObject({ name: 'ConflictError', field: 'username' });
  });

  it('rejects self-onboarding by email (Rule 8)', async () => {
    const userRepository = {
      findProfileById: vi.fn().mockResolvedValue({
        id: 'admin-1',
        tenant_id: 'default',
        email: 'site.admin@vineyards.example',
        full_name: 'Site Admin',
        role: 'Administrator',
        is_disabled: false,
      }),
      findIdByEmail: vi.fn().mockResolvedValue(null),
      createWeddingPlanner: vi.fn(),
    };
    const tenantSuffixProvider = {
      findSuffixByTenantId: vi.fn().mockResolvedValue('wendy'),
    };

    const service = new IdentityService(
      userRepository as any,
      tenantSuffixProvider as any,
    );

    await expect(
      service.onboardWeddingPlanner(basePrincipal, {
        ...baseInput,
        email: 'site.admin@vineyards.example',
      }),
    ).rejects.toMatchObject({ name: 'ConflictError', field: 'email' });
  });
});