package com.vineyards.deerPlanner.events.facade.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Anything null is left untouched. Use this for partial updates (blueprint §5).
 */
public record UpdateEventDto(
    @Size(max = 180)
    String title,

    @Future
    LocalDate eventDate,

    @Size(max = 180)
    String partner1Name,

    @Size(max = 180)
    String partner2Name,

    Boolean countdownEnabled
) {
}
