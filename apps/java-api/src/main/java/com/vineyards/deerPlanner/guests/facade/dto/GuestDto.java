package com.vineyards.deerPlanner.guests.facade.dto;

import java.time.Instant;

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
    Instant rsvpConfirmedAt,
    String rsvpMessage,
    String rsvpDietaryChoice,
    Instant createdAt,
    Instant updatedAt) {}
