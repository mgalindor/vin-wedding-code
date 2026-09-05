package com.vineyards.deerPlanner.identity.facade;

import java.time.Instant;

public record UserPasswordChangedAuditedEvent(String userId, Instant occurredAt) {}
