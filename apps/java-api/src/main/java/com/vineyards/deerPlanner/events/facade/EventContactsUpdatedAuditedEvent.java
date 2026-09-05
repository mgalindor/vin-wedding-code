package com.vineyards.deerPlanner.events.facade;

import java.time.Instant;

public record EventContactsUpdatedAuditedEvent(String eventId, Instant occurredAt) {}
