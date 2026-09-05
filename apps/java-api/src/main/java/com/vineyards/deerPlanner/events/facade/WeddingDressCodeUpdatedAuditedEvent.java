package com.vineyards.deerPlanner.events.facade;

import java.time.Instant;

public record WeddingDressCodeUpdatedAuditedEvent(String eventId, Instant occurredAt) {}
