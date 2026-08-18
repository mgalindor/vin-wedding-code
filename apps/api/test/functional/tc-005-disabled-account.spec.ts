/**
 * TC-005: Disabled account rejected (is_disabled=true blocks login).
 */

import { hash } from 'bcrypt';
import { describe, it, expect, vi } from 'vitest';

import { IdentityService } from '../../src/modules/identity/application/identity.service';

describe('TC-005: IdentityService.authenticate — disabled account rejected', () => {
  it('returns null when user.is_disabled === true', async () => {
    const passwordHash = await hash('CorrectHorse1!', 4);
    const repo = {
      findUserForAuth: vi.fn().mockResolvedValue({
        id: 'u-1',
        email: 'disabled@wendy',
        full_name: 'Disabled User',
        password_hash: passwordHash,
        role: 'Administrator',
        tenant_id: 'default',
        is_disabled: true,
      }),
    };

    const service = new IdentityService(repo as any, {
      findSuffixByTenantId: vi.fn(),
    } as any);

    const result = await service.authenticate('disabled@wendy', 'CorrectHorse1!');

    expect(result).toBeNull();
  });
});