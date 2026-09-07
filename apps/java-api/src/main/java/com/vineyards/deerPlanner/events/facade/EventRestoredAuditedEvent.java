package com.vineyards.deerPlanner.events.facade;

import java.time.Instant;

public record EventRestoredAuditedEvent(String eventId, Instant occurredAt) {}
