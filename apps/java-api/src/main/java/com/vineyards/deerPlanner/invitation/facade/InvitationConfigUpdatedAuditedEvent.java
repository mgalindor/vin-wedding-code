package com.vineyards.deerPlanner.invitation.facade;

import java.time.Instant;

public record InvitationConfigUpdatedAuditedEvent(
    String eventId, boolean activeBefore, boolean activeAfter, Instant occurredAt) {}
