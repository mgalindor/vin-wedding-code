package com.vineyards.deerPlanner.audit.facade.dto;

import java.time.Instant;

/**
 * Quick-look snapshot of activity on a single event. Useful for dashboards that do not want to page
 * through the full audit log to answer "what happened recently on event X?".
 */
public record EventActivitySummaryDto(
    String eventId,
    String createdBy,
    Instant createdAt,
    String lastActorUserId,
    Instant lastActionAt,
    String lastAction,
    Instant lastGuestCaptureAt,
    int lastGuestCaptureCount) {}
