package com.vineyards.deerPlanner.events.facade;

import java.time.Instant;

public record EventProgramUpdatedAuditedEvent(String eventId, Instant occurredAt) {}
