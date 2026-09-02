package com.vineyards.deerPlanner.events.facade;

import com.vineyards.deerPlanner.events.facade.dto.ContactsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.CreateEventDto;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.events.facade.dto.LocationsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.PagedEventsResponse;
import com.vineyards.deerPlanner.events.facade.dto.ProgramPayloadDto;
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

  EventDto getEvent(String eventId, String actorUserId);

  /**
   * Paginated list of the organiser's own events. {@code q} matches against title substring; {@code
   * status} / {@code eventType} are exact matches; the date range narrows by eventDate. Null /
   * blank filters are ignored. The {@code actorUserId} filter is always applied — this endpoint
   * never returns other organisers' rows.
   */
  PagedEventsResponse listOwnEvents(
      String actorUserId,
      String q,
      String status,
      String eventType,
      LocalDate eventDateFrom,
      LocalDate eventDateTo,
      Pageable pageable);

  EventDto updateEventMetadata(String eventId, UpdateEventDto dto, String actorUserId);

  void deleteEvent(String eventId, String actorUserId);

  EventDto archiveEvent(String eventId, String actorUserId);

  EventDto updateLocations(String eventId, LocationsPayloadDto dto, String actorUserId);

  EventDto updateProgram(String eventId, ProgramPayloadDto dto, String actorUserId);

  EventDto updateContacts(String eventId, ContactsPayloadDto dto, String actorUserId);

  /** Internal use by other modules; no auth at this layer. */
  List<EventDto> findByOrganizer(String organizerUserId);

  /**
   * Cross-context read for invitation rendering. Skips ownership checks; the caller (invitation
   * module) is responsible for ensuring the requested eventId corresponds to a live, active
   * invitation before invoking this method.
   */
  Optional<EventDto> findByEventId(String eventId);
}
