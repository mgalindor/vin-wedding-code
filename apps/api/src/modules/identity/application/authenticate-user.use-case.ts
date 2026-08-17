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

  async signIn(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);

    if (!user || !(await compare(password, user.password_hash))) {
      return null;
    }

    if (user.is_disabled) {
      return null;
    }

    return user;
  }
}
