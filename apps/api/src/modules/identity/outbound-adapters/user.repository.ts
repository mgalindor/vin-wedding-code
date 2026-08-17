import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../shared/prisma/prisma.service';

/**
 * Persists users. The use case depends on this; Prisma is an
 * implementation detail. Methods project explicit fields so the
 * password hash never leaks beyond the auth use case.
 */
@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * ⚠️  AUTH-ONLY — DO NOT USE FROM NON-AUTH USE CASES.
   *
   * Loads the credentials (password_hash) needed to run bcrypt.compare.
   * The result MUST be fed straight into AuthenticateUserUseCase and
   * MUST NEVER be returned from a controller, mapped into a response
   * DTO, or logged.
   *
   * For profile-only reads (e.g. /me, list users, invite lookup),
   * add a separate `findProfileByEmail(id)` that excludes password_hash.
   */
  async findUserForAuth(email: string) {
    return this.prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        tenant_id: true,
        email: true,
        full_name: true,
        role: true,
        is_disabled: true,
        password_hash: true,
      },
    });
  }
}
