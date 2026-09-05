package com.vineyards.deerPlanner.identity.facade;

import java.time.Instant;

public record UserDeletedAuditedEvent(String userId, Instant occurredAt) {}
