import { Injectable, Logger } from '@nestjs/common';
import { compare } from 'bcrypt';

import { UserRepository } from '../outbound-adapters/user.repository';

/**
 * Authenticate a user by email and password.
 * Returns the user on success, or null when credentials are wrong or the account is disabled.
 * The controller maps `null` to a generic 401 so the response never reveals which case failed.
 */
@Injectable()
export class AuthenticateUserUseCase {
  private readonly logger = new Logger(AuthenticateUserUseCase.name);

  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async signIn(rawEmail: string, password: string) {
    // Defence-in-depth: normalise even though the DTO already does it
    // via @Transform. Never trust upstream sanitisation.
    const email = (rawEmail ?? '').trim().toLowerCase();

    const user = await this.userRepository.findUserForAuth(email);

    // Always run bcrypt.compare, even when the user is missing, so the
    // response time is constant — protects against user enumeration
    // via timing attacks. The dummy hash below is a pre-computed bcrypt
    // of a random 72-byte string; cost matches the production factor.
    const DUMMY_HASH =
      '$2b$10$CwTycUXWue0Thq9StjUM0uJ8q3pK1y4w8oJ4vq2gF2dC5lQ9hG8aO';
    const passwordToCompare = user?.password_hash ?? DUMMY_HASH;

    const passwordOk = await compare(password, passwordToCompare);

    if (!user || !passwordOk) {
      return null;
    }

    if (user.is_disabled) {
      return null;
    }

    return user;
  }
}
