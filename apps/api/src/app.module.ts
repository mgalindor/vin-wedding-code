import { Module } from '@nestjs/common';

import { AppConfigModule } from './config';
import { AuditModule } from './modules/audit/audit.module';
import { GuestsModule } from './modules/guests/guests.module';
import { HealthModule } from './modules/health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { InvitationModule } from './modules/invitation/invitation.module';
import { PhotosModule } from './modules/photos/photos.module';
import { WeddingsModule } from './modules/weddings/weddings.module';
import { JwtInfrastructureModule } from './shared/jwt/jwt.module';
import { PrismaModule } from './shared/prisma/prisma.module';

/**
 * Root module for the Wendy Planner API.
 *
 * Wires the global typed config (ADR-16), the shared Prisma client
 * (ARC-008), the JWT infrastructure (ARC-013), the Passport strategy
 * (ARC-015), the Terminus health checks (ARC-036), and the seven
 * bounded-context modules (per ADR-09):
 *   - identity   (Identity & Access)
 *   - weddings   (Wedding Management)
 *   - guests     (Guest Management)
 *   - invitation (Invitation — public endpoints, RSVP)
 *   - photos     (Photo Storage — presigned URLs, lifecycle)
 *   - audit      (Audit)
 *   - health     (Terminus health checks)
 *
 * Both JwtAuthGuard and RolesGuard are registered globally in
 * main.ts (using app.useGlobalGuards) because APP_GUARD with
 * useClass does not consistently resolve Reflector under
 * @nestjs/testing in our setup.
 */
@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    JwtInfrastructureModule,
    IdentityModule,
    WeddingsModule,
    GuestsModule,
    InvitationModule,
    PhotosModule,
    AuditModule,
    HealthModule,
  ],
})
export class AppModule {}
