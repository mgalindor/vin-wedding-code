package com.vineyards.deerPlanner.guests.facade.dto;

import java.time.OffsetDateTime;

public record GuestDto(
    String id,
    String groupId,
    String firstName,
    String lastName,
    String email,
    String phone,
    String dietaryNotes,
    boolean primary,
    String invitationToken,
    String rsvpStatus,
    OffsetDateTime rsvpConfirmedAt,
    String rsvpMessage,
    String rsvpDietaryChoice,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}
