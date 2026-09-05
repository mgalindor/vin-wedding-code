package com.vineyards.deerPlanner.audit.facade.dto;

import java.time.Instant;
import java.util.Map;

public record AuditEntryDto(
    String id,
    Instant occurredAt,
    String actorUserId,
    String actorKind,
    String action,
    String resourceType,
    String resourceId,
    String eventId,
    Map<String, Object> payload) {}
