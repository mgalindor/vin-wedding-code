package com.vineyards.deerPlanner.guests.facade;

import java.time.Instant;

public record GuestCreatedAuditedEvent(
    String eventId, String guestId, String groupId, Instant occurredAt) {}
