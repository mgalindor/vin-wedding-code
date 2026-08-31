package com.vineyards.deerPlanner.guests.facade.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Body for {@code POST /api/v1/events/{eventId}/guests}. {@code groupId} is required because a
 * guest belongs to exactly one group (RESTful nesting: the event is the path-level parent, the
 * group is the body-level discriminator).
 */
public record CreateGuestDto(
    @NotBlank String groupId,
    @NotBlank @Size(max = 120) String firstName,
    @NotBlank @Size(max = 120) String lastName,
    @Size(max = 254) String email,
    @Size(max = 32) String phone,
    @Size(max = 4000) String dietaryNotes) {}
