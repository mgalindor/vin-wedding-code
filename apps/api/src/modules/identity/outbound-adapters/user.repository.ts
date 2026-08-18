import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { TenantId, UserId } from '../../../shared/jwt/jwt.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // Auth-only. Never return this from a controller or a DTO mapper.
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

  async findProfileById(id: UserId) {
    return this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        tenant_id: true,
        email: true,
        full_name: true,
        role: true,
        is_disabled: true,
      },
    });
  }

  async findIdByEmail(email: string): Promise<{ id: UserId } | null> {
    const row = await this.prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });
    return row ? { id: row.id as UserId } : null;
  }

  async createWeddingPlanner(input: {
    id: UserId;
    tenantId: TenantId;
    email: string;
    fullName: string;
    phone: string | null;
    passwordHash: string;
    onboardedByAdminId: UserId;
  }) {
    const data: Prisma.usersUncheckedCreateInput = {
      id: input.id,
      tenant_id: input.tenantId,
      email: input.email,
      full_name: input.fullName,
      phone: input.phone,
      password_hash: input.passwordHash,
      role: 'WeddingPlanner',
      is_disabled: false,
      onboarded_by_admin_id: input.onboardedByAdminId,
    };
    return this.prisma.users.create({ data });
  }
}
