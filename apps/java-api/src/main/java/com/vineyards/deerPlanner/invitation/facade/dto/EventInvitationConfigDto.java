package com.vineyards.deerPlanner.invitation.facade.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record EventInvitationConfigDto(
    String eventId,
    String templateId,
    boolean active,
    OffsetDateTime publishedAt,
    LocalDate deadline,
    boolean rsvpEnabled,
    LocalDate rsvpDeadline,
    String slug,
    OffsetDateTime updatedAt
) {
}
