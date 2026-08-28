package com.vineyards.deerPlanner.guests.facade.dto;

import java.time.OffsetDateTime;

public record GuestGroupDto(
    String id,
    String eventId,
    String name,
    String side,
    String relationship,
    String sharedEmail,
    String sharedPhone,
    String primaryGuestId,
    String invitationToken,
    int displayOrder,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}
