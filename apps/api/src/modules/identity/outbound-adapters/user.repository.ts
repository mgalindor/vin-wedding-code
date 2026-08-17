import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../shared/prisma/prisma.service';

/**
 * Persists users. The use case depends on this; Prisma is an implementation detail.
 */
@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.users.findUnique({
      where: { email },
    });
  }
}
