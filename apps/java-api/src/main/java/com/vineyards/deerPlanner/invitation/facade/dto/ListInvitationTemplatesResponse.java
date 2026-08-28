package com.vineyards.deerPlanner.invitation.facade.dto;

import java.util.List;

/**
 * Always wrapped at the root ({@code { items: [...] }}). No bare arrays.
 */
public record ListInvitationTemplatesResponse(
    List<InvitationTemplateDto> items,
    int total
) {
}
