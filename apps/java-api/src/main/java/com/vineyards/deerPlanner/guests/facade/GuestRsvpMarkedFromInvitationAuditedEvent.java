package com.vineyards.deerPlanner.guests.facade;

import java.time.Instant;

/**
 * Variant of {@link GuestRsvpMarkedAuditedEvent} used by the public invitation flow. The audit
 * listener assigns {@code actorKind=invitation} so the entry is distinguishable from admin-driven
 * RSVPs.
 */
public record GuestRsvpMarkedFromInvitationAuditedEvent(
    String eventId, String guestId, String newStatus, Instant occurredAt) {}
