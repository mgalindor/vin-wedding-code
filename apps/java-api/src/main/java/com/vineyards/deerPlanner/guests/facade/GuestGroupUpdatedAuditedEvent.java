package com.vineyards.deerPlanner.guests.facade;

import java.time.Instant;
import java.util.List;

public record GuestGroupUpdatedAuditedEvent(
    String eventId, String groupId, List<String> changedFields, Instant occurredAt) {}
