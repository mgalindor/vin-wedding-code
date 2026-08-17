/**
 * TC-005: Disabled account rejected (is_disabled=true blocks login).
 *
 * Verifies the AuthenticateUserUseCase rejects disabled accounts.
 */

import { describe, it, expect, vi } from 'vitest';
import { hash } from 'bcrypt';

import { AuthenticateUserUseCase } from '../../src/modules/identity/application/authenticate-user.use-case';

describe('TC-005: AuthenticateUserUseCase — disabled account rejected', () => {
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

    const useCase = new AuthenticateUserUseCase(repo as any);

    const result = await useCase.signIn('disabled@wendy', 'CorrectHorse1!');

    expect(result).toBeNull();
  });
});