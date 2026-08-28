package com.vineyards.deerPlanner.guests.domain;

import java.time.OffsetDateTime;
import java.util.Optional;

/**
 * Individual guest. The {@code rsvpStatus} starts as {@code pending} and updates when the
 * guest (or the Organizer on their behalf) confirms attendance. The {@code invitationToken}
 * is a per-guest link used by the partial-RSVP path (target-data-model GL-006).
 */
public record Guest(
    String id,
    String groupId,
    String firstName,
    String lastName,
    Optional<String> email,
    Optional<String> phone,
    Optional<String> dietaryNotes,
    boolean primary,
    String invitationToken,
    RsvpStatus rsvpStatus,
    Optional<OffsetDateTime> rsvpConfirmedAt,
    Optional<String> rsvpMessage,
    Optional<String> rsvpDietaryChoice,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
    public Guest withRsvpStatus(RsvpStatus status, OffsetDateTime confirmedAt) {
        return new Guest(id, groupId, firstName, lastName, email, phone, dietaryNotes,
            primary, invitationToken, status, Optional.ofNullable(confirmedAt), rsvpMessage,
            rsvpDietaryChoice, createdAt, OffsetDateTime.now());
    }
}
