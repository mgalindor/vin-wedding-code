package com.vineyards.deerPlanner.events.facade;

import java.time.Instant;

public record WeddingStoryUpdatedAuditedEvent(String eventId, Instant occurredAt) {}
