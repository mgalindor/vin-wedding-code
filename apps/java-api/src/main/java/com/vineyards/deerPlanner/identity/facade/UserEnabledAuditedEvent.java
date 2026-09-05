package com.vineyards.deerPlanner.identity.facade;

import java.time.Instant;

public record UserEnabledAuditedEvent(String userId, Instant occurredAt) {}
