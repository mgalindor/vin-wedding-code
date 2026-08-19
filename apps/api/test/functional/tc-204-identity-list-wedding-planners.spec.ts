import { describe, it, expect, vi } from 'vitest';

import { IdentityService } from '../../src/modules/identity/application/identity.service';

describe('TC-204: IdentityService.listWeddingPlannersByTenant — US-008', () => {
  const tenantSuffixProvider = {
    findSuffixByTenantId: vi.fn(),
  };

  function makeService(listByTenantSpy: ReturnType<typeof vi.fn>) {
    const userRepository = {
      listByTenant: listByTenantSpy,
    };
    return new IdentityService(
      userRepository as any,
      tenantSuffixProvider as any,
    );
  }

  it('returns the mapped list of Wedding Planners for the calling tenant', async () => {
    const listByTenant = vi.fn().mockResolvedValue([
      {
        id: 'wp-newer',
        tenant_id: 'default',
        email: 'grace@wendy',
        full_name: 'Grace Hopper',
        role: 'WeddingPlanner',
        is_disabled: false,
        created_at: new Date('2026-08-17T10:00:00.000Z'),
      },
      {
        id: 'wp-older',
        tenant_id: 'default',
        email: 'ada@wendy',
        full_name: 'Ada Lovelace',
        role: 'WeddingPlanner',
        is_disabled: true,
        created_at: new Date('2026-08-10T09:00:00.000Z'),
      },
    ]);

    const service = makeService(listByTenant);

    const result = await service.listWeddingPlannersByTenant({
      actorId: 'admin-1',
      tenantId: 'default',
    });

    expect(listByTenant).toHaveBeenCalledTimes(1);
    expect(listByTenant).toHaveBeenCalledWith('default');

    expect(result).toEqual([
      {
        id: 'wp-newer',
        fullName: 'Grace Hopper',
        email: 'grace@wendy',
        role: 'WeddingPlanner',
        isDisabled: false,
        createdAt: '2026-08-17T10:00:00.000Z',
      },
      {
        id: 'wp-older',
        fullName: 'Ada Lovelace',
        email: 'ada@wendy',
        role: 'WeddingPlanner',
        isDisabled: true,
        createdAt: '2026-08-10T09:00:00.000Z',
      },
    ]);
  });

  it('returns an empty array when the tenant has no Wedding Planners', async () => {
    const listByTenant = vi.fn().mockResolvedValue([]);

    const service = makeService(listByTenant);

    const result = await service.listWeddingPlannersByTenant({
      actorId: 'admin-1',
      tenantId: 'default',
    });

    expect(result).toEqual([]);
  });

  it('scopes the query to the calling tenant only', async () => {
    const listByTenant = vi.fn().mockResolvedValue([]);

    const service = makeService(listByTenant);

    await service.listWeddingPlannersByTenant({
      actorId: 'admin-1',
      tenantId: 'tenant-acme',
    });

    expect(listByTenant).toHaveBeenCalledWith('tenant-acme');
  });

  it('never returns password material', async () => {
    const listByTenant = vi.fn().mockResolvedValue([
      {
        id: 'wp-1',
        tenant_id: 'default',
        email: 'wp@wendy',
        full_name: 'Sample WP',
        role: 'WeddingPlanner',
        is_disabled: false,
        created_at: new Date('2026-08-18T00:00:00.000Z'),
      },
    ]);

    const service = makeService(listByTenant);

    const result = await service.listWeddingPlannersByTenant({
      actorId: 'admin-1',
      tenantId: 'default',
    });

    const wire = JSON.stringify(result);
    expect(wire).not.toMatch(/password/i);
    expect(wire).not.toMatch(/bcrypt/i);
    expect(wire).not.toMatch(/\$2[aby]\$/); // bcrypt hash signature
  });

  it('does not mutate any row', async () => {
    const listByTenant = vi.fn().mockResolvedValue([]);
    const createSpy = vi.fn();
    const userRepository = {
      listByTenant,
      createWeddingPlanner: createSpy,
    };

    const service = new IdentityService(
      userRepository as any,
      tenantSuffixProvider as any,
    );

    await service.listWeddingPlannersByTenant({
      actorId: 'admin-1',
      tenantId: 'default',
    });

    expect(createSpy).not.toHaveBeenCalled();
    expect(listByTenant).toHaveBeenCalledTimes(1);
  });
});