package com.vineyards.deerPlanner.guests.facade.dto;

import java.time.Instant;

/**
 * Guest projection. The "primary contact" concept lives on {@link GuestGroupDto#primaryGuestId()} —
 * guests no longer carry a binary primary flag.
 */
public record GuestDto(
    String id,
    String groupId,
    String firstName,
    String lastName,
    String email,
    String phone,
    String dietaryNotes,
    String invitationToken,
    String rsvpStatus,
    Instant rsvpConfirmedAt,
    String rsvpMessage,
    String rsvpDietaryChoice,
    Instant createdAt,
    Instant updatedAt) {}
