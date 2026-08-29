package com.vineyards.deerPlanner.guests.facade.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * The {@code relationship} discriminator is exposed as a String + regex here (rather than the
 * {@code GuestRelationship} enum directly) so the DTO stays in the public surface without importing
 * from the application's internal types. The service layer converts to the enum and rejects unknown
 * values.
 */
public record CreateGuestGroupDto(
    @NotBlank @Size(max = 180) String name,
    @Size(max = 80) String side,
    @NotNull
        @Pattern(
            regexp = "family|friends|other",
            message = "relationship must be one of: family, friends, other")
        String relationship,
    @Size(max = 254) String sharedEmail,
    @Size(max = 32) String sharedPhone,
    Integer displayOrder) {}
