package com.vineyards.deerPlanner.events.facade;

import java.time.Instant;

public record EventLocationsUpdatedAuditedEvent(
    String eventId, int locationCount, Instant occurredAt) {}
