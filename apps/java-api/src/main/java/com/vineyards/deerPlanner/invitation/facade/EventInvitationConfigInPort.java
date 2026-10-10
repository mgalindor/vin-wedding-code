package com.vineyards.deerPlanner.invitation.facade;

import com.vineyards.deerPlanner.invitation.facade.dto.EventInvitationConfigDto;
import com.vineyards.deerPlanner.invitation.facade.dto.UpdateInvitationConfigDto;
import org.jmolecules.architecture.hexagonal.PrimaryPort;

/**
 * Operations on the invitation-config slice of an event (organizer-facing). The invitation-module
 * extends {@code EventInPort} for the create/read/update operations on the event itself (see {@link
 * com.vineyards.deerPlanner.events.facade.EventInPort}); this port is the invitation-specific
 * overlay that doesn't belong on the events module.
 *
 * <p>All methods require ownership of the underlying event â€” the implementation enforces this by
 * re-using {@code events.facade.EventInPort.getEvent} as the ownership proof.
 */
@PrimaryPort
public interface EventInvitationConfigInPort {

  EventInvitationConfigDto getInvitationConfig(String eventId, String actorUserId);

  EventInvitationConfigDto updateInvitationConfig(
      String eventId, UpdateInvitationConfigDto dto, String actorUserId);
}
