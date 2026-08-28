package com.vineyards.deerPlanner.guests.facade.dto;

import jakarta.validation.constraints.Size;

/**
 * Anything null is left untouched (blueprint §5 partial updates).
 */
public record UpdateGuestDto(
    @Size(max = 120) String firstName,
    @Size(max = 120) String lastName,
    @Size(max = 254) String email,
    @Size(max = 32) String phone,
    @Size(max = 4000) String dietaryNotes,
    Boolean primary
) {
}
