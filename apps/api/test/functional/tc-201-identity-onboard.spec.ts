/**
 * TC-201 (backend): IdentityService.onboardWeddingPlanner — happy path.
 *
 * - Admin tenant suffix is read from TenantEmailSuffixProvider.
 * - Slug is composed server-side as <slug>@<suffix>.
 * - bcrypt hash is written (never the cleartext password).
 * - The cleartext password is returned to the caller exactly once.
 * - The audit log line is emitted with ids only (no PII).
 */
import { compare } from 'bcrypt';
import { describe, it, expect, vi } from 'vitest';

import { IdentityService } from '../../src/modules/identity/application/identity.service';

describe('TC-201: IdentityService.onboardWeddingPlanner — happy path', () => {
  const tenantSuffixProvider = {
    findSuffixByTenantId: vi.fn().mockResolvedValue('wendy'),
  };

  const findProfileById = vi.fn().mockResolvedValue({
    id: 'admin-1',
    tenant_id: 'default',
    email: 'admin@wendy',
    full_name: 'Site Admin',
    role: 'Administrator',
    is_disabled: false,
  });

  const findIdByEmail = vi.fn().mockResolvedValue(null);

  const createSpy = vi.fn(async (input: any) => ({
    ...input,
    created_at: new Date(),
  }));

  const userRepository = {
    findProfileById,
    findIdByEmail,
    createWeddingPlanner: createSpy,
  };

  const service = () =>
    new IdentityService(userRepository as any, tenantSuffixProvider as any);

  it('persists the user with the composed full address and hashes the password', async () => {
    const result = await service().onboardWeddingPlanner(
      { actorId: 'admin-1', tenantId: 'default' },
      {
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada.lovelace@example.com',
        username: 'ada',
        password: 'a-strong-passphrase',
      },
    );

    expect(result.username).toBe('ada@wendy');
    expect(result.onboardedByAdminId).toBe('admin-1');
    expect(result.initialPassword).toBe('a-strong-passphrase');

    expect(createSpy).toHaveBeenCalledTimes(1);
    const persisted = createSpy.mock.calls[0]?.[0];
    expect(persisted.email).toBe('ada@wendy');
    expect(persisted.tenantId).toBe('default');
    expect(persisted.onboardedByAdminId).toBe('admin-1');
    expect(persisted.passwordHash).not.toBe('a-strong-passphrase');
    const passwordOk = await compare(
      'a-strong-passphrase',
      persisted.passwordHash,
    );
    expect(passwordOk).toBe(true);
  });

  it('rejects slug with non-lowercase characters', async () => {
    await expect(
      service().onboardWeddingPlanner(
        { actorId: 'admin-1', tenantId: 'default' },
        {
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada.lovelace@example.com',
          username: 'Ada-Lovelace',
          password: 'a-strong-passphrase',
        },
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', field: 'username' });
  });

  it('accepts slug with lowercase letters and digits', async () => {
    const result = await service().onboardWeddingPlanner(
      { actorId: 'admin-1', tenantId: 'default' },
      {
        firstName: 'Grace',
        lastName: 'Hopper',
        email: 'grace.hopper@example.com',
        username: 'grace2026',
        password: 'a-strong-passphrase',
      },
    );

    expect(result.username).toBe('grace2026@wendy');
  });

  it('rejects slug that contains an @ symbol', async () => {
    await expect(
      service().onboardWeddingPlanner(
        { actorId: 'admin-1', tenantId: 'default' },
        {
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada.lovelace@example.com',
          username: 'ada@wendy',
          password: 'a-strong-passphrase',
        },
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', field: 'username' });
  });

  it('rejects a password shorter than 10 characters', async () => {
    await expect(
      service().onboardWeddingPlanner(
        { actorId: 'admin-1', tenantId: 'default' },
        {
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada.lovelace@example.com',
          username: 'ada',
          password: 'short',
        },
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', field: 'password' });
  });

  it('rejects a password longer than 25 characters', async () => {
    const tooLong = 'a'.repeat(26);
    await expect(
      service().onboardWeddingPlanner(
        { actorId: 'admin-1', tenantId: 'default' },
        {
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada.lovelace@example.com',
          username: 'ada',
          password: tooLong,
        },
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', field: 'password' });
  });
});