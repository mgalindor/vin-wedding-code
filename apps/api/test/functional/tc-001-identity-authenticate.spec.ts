/**
 * TC-001 (backend): IdentityService.authenticate returns user on valid credentials.
 *
 * - bcrypt comparison succeeds
 * - Returns full user record
 * - Returns null on miss / wrong password / disabled
 */

import { hash } from 'bcrypt';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { IdentityService } from '../../src/modules/identity/application/identity.service';

describe('TC-001: IdentityService.authenticate — valid credentials', () => {
  let repo: { findUserForAuth: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repo = { findUserForAuth: vi.fn() };
  });

  const makeService = () =>
    new IdentityService(repo as any, { findSuffixByTenantId: vi.fn() } as any);

  it('returns the user when password matches', async () => {
    const passwordHash = await hash('CorrectHorse1!', 4);
    const storedUser = {
      id: 'u-1',
      email: 'admin@wendy',
      full_name: 'Administrator',
      password_hash: passwordHash,
      role: 'Administrator',
      tenant_id: 'default',
      is_disabled: false,
    };
    repo.findUserForAuth.mockResolvedValue(storedUser);

    const result = await makeService().authenticate('admin@wendy', 'CorrectHorse1!');

    expect(result).toEqual(storedUser);
  });

  it('returns null when password does not match', async () => {
    const passwordHash = await hash('CorrectHorse1!', 4);
    repo.findUserForAuth.mockResolvedValue({
      id: 'u-1',
      email: 'admin@wendy',
      password_hash: passwordHash,
      is_disabled: false,
    });

    const result = await makeService().authenticate('admin@wendy', 'wrong-password');

    expect(result).toBeNull();
  });

  it('returns null when user does not exist', async () => {
    repo.findUserForAuth.mockResolvedValue(null);

    const result = await makeService().authenticate('nobody@wendy', 'whatever');

    expect(result).toBeNull();
  });
});