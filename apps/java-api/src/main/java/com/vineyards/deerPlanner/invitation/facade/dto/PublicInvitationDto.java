package com.vineyards.deerPlanner.invitation.facade.dto;

import com.vineyards.deerPlanner.events.facade.dto.EventDto;

/**
 * Aggregated public view of an invitation. The controller serialises the full event plus the active
 * template. The per-guest list is omitted at this stage (it lives in the {@code guests} bounded
 * context once that module lands).
 */
public record PublicInvitationDto(
    String slug,
    boolean active,
    boolean rsvpEnabled,
    EventDto event,
    InvitationTemplateDto template) {}
