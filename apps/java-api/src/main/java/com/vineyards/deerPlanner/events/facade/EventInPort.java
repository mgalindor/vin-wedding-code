package com.vineyards.deerPlanner.events.facade;

import com.vineyards.deerPlanner.events.facade.dto.ContactsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.CreateEventDto;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.events.facade.dto.ListEventsResponse;
import com.vineyards.deerPlanner.events.facade.dto.LocationsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.ProgramPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.UpdateEventDto;
import java.util.List;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.PrimaryPort;

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

  ListEventsResponse listOwnEvents(String actorUserId);

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
