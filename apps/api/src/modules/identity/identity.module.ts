import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { IdentityService } from './application/identity.service';
import { JwksController } from './controllers/jwks.controller';
import { AuthController } from './inbound-adapters/auth.controller';
import { WeddingPlannersController } from './inbound-adapters/wedding-planners.controller';
import { tenantEmailSuffixProviderBinding } from './outbound-adapters/prisma-tenant-email-suffix.provider';
import { UserRepository } from './outbound-adapters/user.repository';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt', session: false })],
  controllers: [
    JwksController,
    AuthController,
    WeddingPlannersController,
  ],
  providers: [
    JwtStrategy,
    IdentityService,
    UserRepository,
    tenantEmailSuffixProviderBinding,
  ],
})
export class IdentityModule {}
