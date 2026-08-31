package com.vineyards.deerPlanner.invitation.facade;

import com.vineyards.deerPlanner.invitation.facade.dto.PublicGroupRsvpRequestDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicGroupViewDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicInvitationDto;
import org.jmolecules.architecture.hexagonal.PrimaryPort;

/**
 * Primary port for the public invitation surface. Event-level reads use {@link #getBySlug(String)};
 * the group-level RSVP flow uses {@link #getGroup(String, String)} and {@link
 * #submitGroupRsvp(String, String, PublicGroupRsvpRequestDto)} — both require a valid {@code
 * groupToken} in addition to the {@code slug}.
 */
@PrimaryPort
public interface PublicInvitationInPort {

  PublicInvitationDto getBySlug(String slug);

  PublicGroupViewDto getGroup(String slug, String groupToken);

  PublicGroupViewDto submitGroupRsvp(String slug, String groupToken, PublicGroupRsvpRequestDto dto);
}
