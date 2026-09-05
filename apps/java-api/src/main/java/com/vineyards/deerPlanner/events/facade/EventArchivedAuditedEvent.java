package com.vineyards.deerPlanner.events.facade;

import java.time.Instant;

public record EventArchivedAuditedEvent(String eventId, Instant occurredAt) {}
