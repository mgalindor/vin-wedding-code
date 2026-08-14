import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { JwksController } from './controllers/jwks.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Identity bounded context (ADR-09). ARC-013 ships the JWT strategy
 * and the public-key discovery endpoint. ARC-014 will add the
 * /oauth/* controllers; ARC-017 will add LocalAuthService.
 *
 * PassportModule is registered here so the JWT strategy registers with
 * the name 'jwt'. JwtAuthGuard (in shared/guards) references it via
 * AuthGuard('jwt').
 */
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt', session: false })],
  controllers: [JwksController],
  providers: [JwtStrategy],
})
export class IdentityModule {}
