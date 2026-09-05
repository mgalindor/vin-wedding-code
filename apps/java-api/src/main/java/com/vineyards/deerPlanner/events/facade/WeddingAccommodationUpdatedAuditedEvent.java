package com.vineyards.deerPlanner.events.facade;

import java.time.Instant;

public record WeddingAccommodationUpdatedAuditedEvent(String eventId, Instant occurredAt) {}
