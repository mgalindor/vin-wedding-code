package com.vineyards.deerPlanner.guests.facade;

import com.vineyards.deerPlanner.guests.facade.dto.CreateGuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.CreateGuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.ListGuestGroupsResponse;
import com.vineyards.deerPlanner.guests.facade.dto.ListGuestsResponse;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestGroupDto;
import org.jmolecules.architecture.hexagonal.PrimaryPort;

import java.util.List;

/**
 * Primary port for the guest list bounded context. Implemented by
 * {@code guests/application/GuestGroupService} and {@code guests/application/GuestService}
 * which together make the full guest list available to the inbound layer and the
 * invitation module (when it later needs to resolve invitation tokens for the public
 * RSVP flow).
 */
@PrimaryPort
public interface GuestApi {

    // ----- Group operations -----

    ListGuestGroupsResponse listGroups(String eventId, String actorUserId);

    GuestGroupDto getGroup(String groupId, String actorUserId);

    GuestGroupDto createGroup(String eventId, CreateGuestGroupDto dto, String actorUserId);

    GuestGroupDto updateGroup(String groupId, UpdateGuestGroupDto dto, String actorUserId);

    void deleteGroup(String groupId, String actorUserId);

    /** Issues a fresh UUID for {@code invitation_token}, invalidating the previous link. */
    GuestGroupDto regenerateGroupToken(String groupId, String actorUserId);

    // ----- Guest operations -----

    ListGuestsResponse listGuests(String eventId, String actorUserId);

    GuestDto getGuest(String guestId, String actorUserId);

    GuestDto createGuest(String eventId, CreateGuestDto dto, String actorUserId);

    GuestDto updateGuest(String guestId, UpdateGuestDto dto, String actorUserId);

    void deleteGuest(String guestId, String actorUserId);

    /** Aggregate across all groups in an event — used by the dashboard and by the
     *  invitation module to render the family composition in the public view. */
    List<GuestDto> findAllForEvent(String eventId);
}
