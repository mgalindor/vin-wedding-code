package com.vineyards.deerPlanner.guests.domain;

import java.time.OffsetDateTime;
import java.util.Optional;

/**
 * A group of guests within an event. The {@code invitationToken} is the per-group link
 * the Organizer shares. Each group fans out to N {@link Guest}
 * rows that hold the individual RSVP status.
 */
public record GuestGroup(
    String id,
    String eventId,
    String name,
    Optional<String> side,
    GuestRelationship relationship,
    Optional<String> sharedEmail,
    Optional<String> sharedPhone,
    Optional<String> primaryGuestId,
    String invitationToken,
    int displayOrder,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
    public GuestGroup withToken(String newToken) {
        return new GuestGroup(id, eventId, name, side, relationship, sharedEmail, sharedPhone,
            primaryGuestId, newToken, displayOrder, createdAt, OffsetDateTime.now());
    }

    public GuestGroup withPrimaryGuest(String primaryGuestId) {
        return new GuestGroup(id, eventId, name, side, relationship, sharedEmail, sharedPhone,
            Optional.ofNullable(primaryGuestId), invitationToken, displayOrder,
            createdAt, OffsetDateTime.now());
    }
}
