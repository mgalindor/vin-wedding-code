package com.vineyards.deerPlanner.events.facade.dto;

import com.vineyards.deerPlanner.events.domain.EventType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * Minimal event creation payload. Anything type-specific (couple names, honoree name, age, etc.)
 * goes through the corresponding event-type extension controller (e.g. {@code
 * WeddingEventController}) after the event exists.
 */
public record CreateEventDto(
    @NotBlank @Size(max = 180) String title,
    @NotNull EventType eventType,
    @NotNull @Future LocalDate eventDate) {}
