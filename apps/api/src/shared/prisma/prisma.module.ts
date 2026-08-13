import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

// Global Prisma module — any bounded context can inject PrismaService
// without re-importing this module (ARC-008).
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}