package com.vineyards.deerPlanner.guests.facade;

import java.time.Instant;
import java.util.List;

public record GuestUpdatedAuditedEvent(
    String eventId, String guestId, List<String> changedFields, Instant occurredAt) {}
