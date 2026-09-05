package com.vineyards.deerPlanner.events.facade;

import java.time.Instant;

public record WeddingLandingUpdatedAuditedEvent(String eventId, Instant occurredAt) {}
