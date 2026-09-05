package com.vineyards.deerPlanner.identity.facade;

import java.time.Instant;
import java.util.List;

public record UserUpdatedAuditedEvent(
    String userId, List<String> changedFields, boolean isSelf, Instant occurredAt) {}
