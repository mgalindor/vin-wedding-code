package com.vineyards.deerPlanner.guests.facade.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Anything null is left untouched.
 */
public record UpdateGuestGroupDto(
    @Size(max = 180) String name,
    @Size(max = 80) String side,
    @Pattern(regexp = "family|friends|other",
        message = "relationship must be one of: family, friends, other")
    String relationship,
    @Size(max = 254) String sharedEmail,
    @Size(max = 32) String sharedPhone,
    Integer displayOrder
) {
}
