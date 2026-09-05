package com.vineyards.deerPlanner.events.facade;

import com.vineyards.deerPlanner.events.facade.dto.ContactsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.CreateEventDto;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.events.facade.dto.LocationsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.PagedEventsResponse;
import com.vineyards.deerPlanner.events.facade.dto.ProgramPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.ReassignOrganizerDto;
import com.vineyards.deerPlanner.events.facade.dto.UpdateEventDto;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.PrimaryPort;
import org.springframework.data.domain.Pageable;

/**
 * Primary port for the events bounded context. Wedding-, birthday- or anniversary-specific state
 * lives behind the corresponding extension port (e.g. {@link WeddingEventInPort}) — this one
 * intentionally knows nothing about any particular event type beyond {@link
 * com.vineyards.deerPlanner.events.domain.EventType}.
 */
@PrimaryPort
public interface EventInPort {

  EventDto createEvent(CreateEventDto dto, String actorUserId);

  EventDto getEvent(String eventId);

  /**
   * Paginated list of events visible to the actor. Admins see every event; organisers see only
   * their own. {@code title} matches against title substring; {@code status} / {@code eventType}
   * are exact matches; the date range narrows by eventDate. Null / blank filters are ignored.
   */
  PagedEventsResponse listOwnEvents(
      String actorUserId,
      boolean actorIsAdmin,
      String title,
      String status,
      String eventType,
      LocalDate eventDateFrom,
      LocalDate eventDateTo,
      Pageable pageable);

  EventDto updateEventMetadata(String eventId, UpdateEventDto dto);

  void deleteEvent(String eventId);

  EventDto archiveEvent(String eventId);

  EventDto updateLocations(String eventId, LocationsPayloadDto dto);

  EventDto updateProgram(String eventId, ProgramPayloadDto dto);

  EventDto updateContacts(String eventId, ContactsPayloadDto dto);

  /**
   * Admin-only: reassigns the organiser of an existing event. The new organiser must be an
   * existing, active user (validated via {@code UserInPort.existsActiveUser}). Throws {@code
   * ResourceNotFoundError} if either the event or the target user is missing.
   */
  EventDto reassignOrganizer(String eventId, ReassignOrganizerDto dto, String actorUserId);

  /** Internal use by other modules; no auth at this layer. */
  List<EventDto> findByOrganizer(String organizerUserId);

  /**
   * Cross-context read for invitation rendering. Skips ownership checks; the caller (invitation
   * module) is responsible for ensuring the requested eventId corresponds to a live, active
   * invitation before invoking this method.
   */
  Optional<EventDto> findByEventId(String eventId);
}
