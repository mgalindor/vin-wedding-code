package com.vineyards.deerPlanner.events.facade.dto;

import com.vineyards.deerPlanner.events.domain.EventStatus;
import com.vineyards.deerPlanner.events.domain.EventType;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Aggregate view of an event. Type-specific state (wedding detail, birthday honoree, etc.) is NOT
 * included here — fetch it from the corresponding extension controller (e.g. {@code GET
 * /events/{id}/wedding-detail}).
 */
public record EventDto(
    String id,
    String organizerId,
    EventType eventType,
    String title,
    LocalDate eventDate,
    EventStatus status,
    LocationsPayloadDto locations,
    ProgramPayloadDto program,
    ContactsPayloadDto contacts,
    Instant createdAt,
    Instant updatedAt) {}
