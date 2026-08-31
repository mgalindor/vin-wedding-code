package com.vineyards.deerPlanner.guests.facade.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Lighter variant of {@link CreateGuestDto} used inline inside {@link CreateGuestGroupDto}. The
 * {@code groupId} is implied by the parent group being created, so the caller does not (and must
 * not) supply it.
 */
public record InlineGuestDto(
    @NotBlank @Size(max = 120) String firstName,
    @NotBlank @Size(max = 120) String lastName,
    @Size(max = 254) String email,
    @Size(max = 32) String phone,
    @Size(max = 4000) String dietaryNotes,
    Boolean primary) {}
