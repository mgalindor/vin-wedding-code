package com.vineyards.deerPlanner.invitation.facade.dto;

import java.util.List;

/**
 * Always wrapped at the root ({@code { items: [...] }} per blueprint §6). No bare arrays.
 */
public record ListInvitationTemplatesResponse(
    List<InvitationTemplateDto> items,
    int total
) {
}
