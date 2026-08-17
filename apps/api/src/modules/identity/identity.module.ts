import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './inbound-adapters/auth.controller';
import { UserRepository } from './outbound-adapters/user.repository';
import { AuthenticateUserUseCase } from './application/authenticate-user.use-case';
import { JwksController } from './controllers/jwks.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Identity context: login, JWT issuance, and public-key discovery.
 */
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt', session: false })],
  controllers: [JwksController, AuthController],
  providers: [JwtStrategy, AuthenticateUserUseCase, UserRepository],
})
export class IdentityModule {}
