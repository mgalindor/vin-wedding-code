package com.vineyards.deerPlanner.events.facade;

import java.time.Instant;

public record EventDeletedAuditedEvent(String eventId, Instant occurredAt) {}
