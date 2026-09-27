package com.vineyards.deerPlanner.guests.facade.dto;

import jakarta.validation.constraints.Size;

/** Anything null is left untouched. */
public record UpdateGuestDto(
    @Size(max = 240) String fullName,
    @Size(max = 254) String email,
    @Size(max = 32) String phone,
    @Size(max = 4000) String dietaryNotes) {}
