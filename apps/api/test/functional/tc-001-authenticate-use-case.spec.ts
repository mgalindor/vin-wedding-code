/**
 * TC-001 (backend): AuthenticateUserUseCase returns user on valid credentials.
 *
 * - bcrypt comparison succeeds
 * - Returns full user record
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hash } from 'bcrypt';

import { AuthenticateUserUseCase } from '../../src/modules/identity/application/authenticate-user.use-case';

describe('TC-001: AuthenticateUserUseCase — valid credentials', () => {
  let repo: { findUserForAuth: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repo = { findUserForAuth: vi.fn() };
  });

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

    const useCase = new AuthenticateUserUseCase(repo as any);
    const result = await useCase.signIn('admin@wendy', 'CorrectHorse1!');

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

    const useCase = new AuthenticateUserUseCase(repo as any);
    const result = await useCase.signIn('admin@wendy', 'wrong-password');

    expect(result).toBeNull();
  });

  it('returns null when user does not exist', async () => {
    repo.findUserForAuth.mockResolvedValue(null);

    const useCase = new AuthenticateUserUseCase(repo as any);
    const result = await useCase.signIn('nobody@wendy', 'whatever');

    expect(result).toBeNull();
  });
});