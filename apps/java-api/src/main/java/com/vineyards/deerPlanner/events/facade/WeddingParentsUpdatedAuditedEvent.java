package com.vineyards.deerPlanner.events.facade;

import java.time.Instant;

public record WeddingParentsUpdatedAuditedEvent(String eventId, Instant occurredAt) {}
