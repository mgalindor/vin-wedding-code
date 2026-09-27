package com.vineyards.deerPlanner.guests.facade.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Lighter variant of {@link CreateGuestDto} used inline inside {@link CreateGuestGroupDto}. The
 * {@code groupId} is implied by the parent group being created, so the caller does not (and must
 * not) supply it.
 *
 * <p>The {@code primary} flag is a <b>request hint only</b> — it is never stored on the {@code
 * Guest} entity. Exactly one inline guest MUST carry {@code primary = true} so the service can
 * identify which one becomes the group's {@code primaryGuestId} at creation time. Zero or more than
 * one is rejected as a validation error.
 */
public record InlineGuestDto(
    @NotBlank @Size(max = 240) String fullName,
    @Size(max = 254) String email,
    @Size(max = 32) String phone,
    @Size(max = 4000) String dietaryNotes,
    Boolean primary) {}
