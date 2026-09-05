package com.vineyards.deerPlanner.events.facade;

import java.time.Instant;

public record EventCreatedAuditedEvent(
    String eventId, String eventType, String title, Instant occurredAt) {}
