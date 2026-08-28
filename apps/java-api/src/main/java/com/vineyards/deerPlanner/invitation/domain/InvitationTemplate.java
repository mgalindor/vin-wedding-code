package com.vineyards.deerPlanner.invitation.domain;

import java.time.OffsetDateTime;

public record InvitationTemplate(
    String id,
    String code,
    String eventType,
    String name,
    String description,
    boolean active,
    int displayOrder,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}
