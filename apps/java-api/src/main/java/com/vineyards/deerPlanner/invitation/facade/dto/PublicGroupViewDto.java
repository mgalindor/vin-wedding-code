package com.vineyards.deerPlanner.invitation.facade.dto;

import com.vineyards.deerPlanner.guests.facade.dto.GuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestGroupDto;
import java.util.List;

/**
 * Public view of a guest group: the group metadata + the list of guests the primary contact can
 * mark as attending or not. Returned by {@code GET /public/invitations/{slug}/groups/{groupToken}}.
 */
public record PublicGroupViewDto(String slug, GuestGroupDto group, List<GuestDto> guests) {}
