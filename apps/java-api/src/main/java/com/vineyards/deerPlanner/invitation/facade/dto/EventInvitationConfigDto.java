package com.vineyards.deerPlanner.invitation.facade.dto;

import java.time.Instant;
import java.time.LocalDate;

public record EventInvitationConfigDto(
    String eventId,
    String templateId,
    boolean active,
    Instant publishedAt,
    LocalDate deadline,
    boolean rsvpEnabled,
    LocalDate rsvpDeadline,
    String slug,
    Instant updatedAt) {}
