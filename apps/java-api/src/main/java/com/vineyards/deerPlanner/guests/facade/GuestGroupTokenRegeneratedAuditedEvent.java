package com.vineyards.deerPlanner.guests.facade;

import java.time.Instant;

public record GuestGroupTokenRegeneratedAuditedEvent(
    String eventId, String groupId, Instant occurredAt) {}
