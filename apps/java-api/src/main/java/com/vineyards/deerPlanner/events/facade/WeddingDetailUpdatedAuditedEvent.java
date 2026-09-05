package com.vineyards.deerPlanner.events.facade;

import java.time.Instant;
import java.util.List;

public record WeddingDetailUpdatedAuditedEvent(
    String eventId, List<String> changedFields, Instant occurredAt) {}
