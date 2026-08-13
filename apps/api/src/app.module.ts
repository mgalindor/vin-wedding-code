import { Module } from '@nestjs/common';

import { AppConfigModule } from './config';
import { AuditModule } from './modules/audit/audit.module';
import { GuestsModule } from './modules/guests/guests.module';
import { HealthModule } from './modules/health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { InvitationModule } from './modules/invitation/invitation.module';
import { PhotosModule } from './modules/photos/photos.module';
import { WeddingsModule } from './modules/weddings/weddings.module';

/**
 * Root module for the Wendy Planner API.
 *
 * Wires the global typed config (ADR-16) and the seven bounded-context
 * modules (per ADR-09):
 *   - identity   (Identity & Access)
 *   - weddings   (Wedding Management)
 *   - guests     (Guest Management)
 *   - invitation (Invitation — public endpoints, RSVP)
 *   - photos     (Photo Storage — presigned URLs, lifecycle)
 *   - audit      (Audit)
 *   - health     (Terminus health checks — stubbed in ARC-003, real in ARC-036)
 */
@Module({
  imports: [
    AppConfigModule,
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
