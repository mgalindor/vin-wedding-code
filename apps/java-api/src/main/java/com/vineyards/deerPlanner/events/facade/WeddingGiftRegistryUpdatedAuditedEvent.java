package com.vineyards.deerPlanner.events.facade;

import java.time.Instant;

public record WeddingGiftRegistryUpdatedAuditedEvent(String eventId, Instant occurredAt) {}
