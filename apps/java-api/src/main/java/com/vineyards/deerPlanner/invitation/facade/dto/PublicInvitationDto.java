package com.vineyards.deerPlanner.invitation.facade.dto;

import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingDetailDto;

/**
 * Aggregated public view of an invitation. The controller serialises the base event plus the active
 * template. Type-specific state ({@code wedding}) is fetched separately by {@code
 * PublicInvitationService} and bundled here; it is {@code null} for non-wedding events or when the
 * organizer has not configured the wedding detail yet.
 */
public record PublicInvitationDto(
    String slug,
    boolean active,
    boolean rsvpEnabled,
    EventDto event,
    InvitationTemplateDto template,
    WeddingDetailDto wedding) {}
