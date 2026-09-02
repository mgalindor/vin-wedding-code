package com.vineyards.deerPlanner.guests.facade;

import com.vineyards.deerPlanner.guests.facade.dto.ChangeGuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.CreateGuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.CreateGuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.ListGuestGroupsResponse;
import com.vineyards.deerPlanner.guests.facade.dto.PagedGuestsResponse;
import com.vineyards.deerPlanner.guests.facade.dto.RsvpUpdateDto;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestGroupPrimaryDto;
import java.util.List;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.PrimaryPort;
import org.springframework.data.domain.Pageable;

/**
 * Primary port for the guest list bounded context. Implemented by {@link
 * com.vineyards.deerPlanner.guests.application.GuestService}.
 *
 * <p>Two RSVP surfaces share the same persistence:
 *
 * <ul>
 *   <li><b>Admin</b> — {@link #markGroupRsvp} and {@link #markGuestRsvp} require the actor to own
 *       the event (via the events module).
 *   <li><b>Public invitation</b> — {@link #applyRsvpFromInvitation} skips ownership; the caller
 *       (invitation module) has already validated the {@code groupToken}.
 * </ul>
 */
@PrimaryPort
public interface GuestInPort {

  // ----- Group operations -----

  ListGuestGroupsResponse listGroups(String eventId, String actorUserId);

  GuestGroupDto getGroup(String groupId, String actorUserId);

  GuestGroupDto createGroup(String eventId, CreateGuestGroupDto dto, String actorUserId);

  GuestGroupDto updateGroup(String groupId, UpdateGuestGroupDto dto, String actorUserId);

  void deleteGroup(String groupId, String actorUserId);

  /** Issues a fresh UUID for {@code invitation_token}, invalidating the previous link. */
  GuestGroupDto regenerateGroupToken(String groupId, String actorUserId);

  /**
   * Sets (or clears, when {@code guestId} is null) the group's {@code primaryGuestId}. The guest
   * must already belong to the group. Use this when the contact person for a family changes — the
   * binary flag stays at the group level only.
   */
  GuestGroupDto updatePrimaryGuest(
      String groupId, UpdateGuestGroupPrimaryDto dto, String actorUserId);

  // ----- Guest operations -----

  /**
   * Paginated guest listing for an event. {@code groupId} and {@code rsvpStatus} filter exactly;
   * {@code q} is a case-insensitive substring match against firstName / lastName. Null / blank
   * filters are ignored.
   */
  PagedGuestsResponse listGuests(
      String eventId,
      String groupId,
      String rsvpStatus,
      String q,
      String actorUserId,
      Pageable pageable);

  GuestDto getGuest(String guestId, String actorUserId);

  GuestDto createGuest(String eventId, CreateGuestDto dto, String actorUserId);

  GuestDto updateGuest(String guestId, UpdateGuestDto dto, String actorUserId);

  void deleteGuest(String guestId, String actorUserId);

  /**
   * Moves a guest to a different group, or unassigns it when {@link ChangeGuestGroupDto#groupId()}
   * is {@code null}. Validates that both the current and (when present) the target group belong to
   * the event identified by {@code eventId}. When the moved guest was the {@code primaryGuestId} of
   * the old group, that reference is cleared.
   */
  GuestDto changeGuestGroup(
      String eventId, String guestId, ChangeGuestGroupDto dto, String actorUserId);

  // ----- RSVP operations (admin) -----

  /** Marks every guest in the group with the given RSVP status. Returns the group unchanged. */
  GuestGroupDto markGroupRsvp(String groupId, RsvpUpdateDto dto, String actorUserId);

  /** Marks a single guest with the given RSVP status. */
  GuestDto markGuestRsvp(String guestId, RsvpUpdateDto dto, String actorUserId);

  // ----- RSVP operations (public invitation flow, no auth) -----

  /**
   * Public-context RSVP write. No ownership check — the caller has already proven control of the
   * group via its invitation token. Returns the updated guest.
   */
  GuestDto applyRsvpFromInvitation(String guestId, RsvpUpdateDto dto);

  // ----- Cross-context reads (used by invitation module) -----

  /** Aggregate across all groups in an event — used by the dashboard. */
  List<GuestDto> findAllForEvent(String eventId);

  /** Lists the guests that belong to a single group. */
  List<GuestDto> listGuestsByGroupId(String groupId);

  /** Resolves a group by its public invitation token. */
  Optional<GuestGroupDto> findGroupByInvitationToken(String token);
}
