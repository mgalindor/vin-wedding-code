package com.vineyards.deerPlanner.identity.facade;

import java.time.Instant;
import java.util.Set;

public record UserCreatedAuditedEvent(
    String userId, String username, Set<String> roles, Instant occurredAt) {}
