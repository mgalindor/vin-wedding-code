package com.vineyards.deerPlanner.identity.facade;

import java.time.Instant;

public record UserDisabledAuditedEvent(String userId, Instant occurredAt) {}
