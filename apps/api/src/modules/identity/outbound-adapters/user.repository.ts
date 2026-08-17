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
   * Find a user by email. Returns the fields required for password
   * verification and the public profile — explicitly NOT every column.
   * `password_hash` is included here only because the use case needs it
   * to run bcrypt.compare; it must never be returned to a controller.
   */
  async findByEmail(email: string) {
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
