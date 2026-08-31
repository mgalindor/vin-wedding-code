package com.vineyards.deerPlanner.guests.facade.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * The {@code relationship} discriminator is exposed as a String + regex here (rather than the
 * {@code GuestRelationship} enum directly) so the DTO stays in the public surface without importing
 * from the application's internal types. The service layer converts to the enum and rejects unknown
 * values.
 *
 * <p>{@code guests} is an optional inline list: when present, those guests are created together
 * with the group in a single request. The first guest marked {@code primary} (or the first guest if
 * none is marked) becomes the group's {@code primaryGuestId}.
 */
public record CreateGuestGroupDto(
    @NotBlank @Size(max = 180) String name,
    @NotNull
        @Pattern(
            regexp = "family|friends|other",
            message = "relationship must be one of: family, friends, other")
        String relationship,
    @Size(max = 254) String sharedEmail,
    @Size(max = 32) String sharedPhone,
    Integer displayOrder,
    @Valid List<InlineGuestDto> guests) {}
