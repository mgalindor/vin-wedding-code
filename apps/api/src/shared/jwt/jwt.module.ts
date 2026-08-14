import { Global, Module } from '@nestjs/common';

import { JwtService } from './jwt.service';

// Global JWT infrastructure (ADR-15). JwtService is the single issuance /
// verification entry point for the API. Bounded contexts depend on it,
// not on @nestjs/jwt directly.
//
// We use jsonwebtoken directly — the underlying library for both
// passport-jwt and @nestjs/jwt — to keep the dependency surface flat.
@Global()
@Module({
  providers: [JwtService],
  exports: [JwtService],
})
export class JwtInfrastructureModule {}
