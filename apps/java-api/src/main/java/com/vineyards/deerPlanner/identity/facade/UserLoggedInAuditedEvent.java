package com.vineyards.deerPlanner.identity.facade;

import java.time.Instant;
import java.util.Set;

public record UserLoggedInAuditedEvent(String userId, Set<String> roles, Instant occurredAt) {}
