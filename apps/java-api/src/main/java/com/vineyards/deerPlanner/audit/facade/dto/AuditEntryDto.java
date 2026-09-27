package com.vineyards.deerPlanner.audit.facade.dto;

import java.time.Instant;
import java.util.Map;

/**
 * One row of the event activity feed.
 *
 * <p>{@code actorUserId} is the raw FK (the XID minted for the user). {@code actorUserName} is the
 * hydrated {@code displayName} so the FE can render "por María" without doing an N+1 lookup per
 * row. {@code actorUserName} is {@code null} for system actors and for users that have since been
 * soft-deleted — the FE should fall back to a generic label in those cases.
 */
public record AuditEntryDto(
    String id,
    Instant occurredAt,
    String actorUserId,
    String actorUserName,
    String actorKind,
    String action,
    String resourceType,
    String resourceId,
    String eventId,
    Map<String, Object> payload) {}
