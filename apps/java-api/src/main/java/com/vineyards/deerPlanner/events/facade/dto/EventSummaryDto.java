package com.vineyards.deerPlanner.events.facade.dto;

import com.vineyards.deerPlanner.events.domain.EventStatus;
import com.vineyards.deerPlanner.events.domain.EventType;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Compact event projection for listings and cross-module references. The full {@link EventDto} is
 * reserved for the detail endpoint.
 */
public record EventSummaryDto(
    String id,
    String organizerId,
    EventType eventType,
    String title,
    LocalDate eventDate,
    EventStatus status,
    Instant updatedAt) {}
