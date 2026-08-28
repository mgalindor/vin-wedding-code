package com.vineyards.deerPlanner.invitation.facade;

import com.vineyards.deerPlanner.invitation.facade.dto.PublicInvitationDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicRsvpRequestDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicRsvpResponseDto;
import org.jmolecules.architecture.hexagonal.PrimaryPort;

/**
 * Primary port for the public invitation surface (no JWT required; the {@code slug} IS
 * the access token). Implemented by {@code invitation/application/PublicInvitationService}.
 *
 * <p>The route is exposed under {@code /api/v1/public/invitations/**} and {@code permitAll()}
 * in the security config. Authorisation happens by virtue of knowing the slug (which
 * is regenerated when the Organizer rotates it; see {@link
 * com.vineyards.deerPlanner.invitation.application.port.EventInvitationConfigRepository#existsBySlug}).
 */
@PrimaryPort
public interface PublicInvitationFacade {

    PublicInvitationDto getBySlug(String slug);

    PublicRsvpResponseDto submitRsvp(String slug, PublicRsvpRequestDto dto);
}
