package com.vineyards.deerPlanner.invitation.facade.dto;

import java.time.OffsetDateTime;

/**
 * {@code eventType} is exposed as a String here on purpose: the DTO lives in the
 * {@code invitation} module's public surface and must not import the events module's
 * internal {@code EventType} enum (Spring Modulith boundary rule). Clients interpret the
 * value against the catalogue (see {@code invitation_templates} seed).
 */
public record InvitationTemplateDto(
    String id,
    String code,
    String eventType,
    String name,
    String description,
    int displayOrder,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}
