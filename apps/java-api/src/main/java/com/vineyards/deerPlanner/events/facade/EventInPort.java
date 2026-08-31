package com.vineyards.deerPlanner.events.facade;

import com.vineyards.deerPlanner.events.facade.dto.ContactsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.CreateEventDto;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.events.facade.dto.ListEventsResponse;
import com.vineyards.deerPlanner.events.facade.dto.LocationsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.ProgramPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.UpdateEventDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingAccommodationPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingDressCodePayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingGiftRegistryPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingLandingPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingParentsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingStoryPayloadDto;
import java.util.List;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.PrimaryPort;

@PrimaryPort
public interface EventInPort {

  EventDto createEvent(CreateEventDto dto, String actorUserId);

  EventDto getEvent(String eventId, String actorUserId);

  ListEventsResponse listOwnEvents(String actorUserId);

  EventDto updateEventMetadata(String eventId, UpdateEventDto dto, String actorUserId);

  void deleteEvent(String eventId, String actorUserId);

  EventDto publishEvent(String eventId, String actorUserId);

  EventDto archiveEvent(String eventId, String actorUserId);

  EventDto updateLocations(String eventId, LocationsPayloadDto dto, String actorUserId);

  EventDto updateProgram(String eventId, ProgramPayloadDto dto, String actorUserId);

  EventDto updateContacts(String eventId, ContactsPayloadDto dto, String actorUserId);

  EventDto updateWeddingLanding(String eventId, WeddingLandingPayloadDto dto, String actorUserId);

  EventDto updateWeddingStory(String eventId, WeddingStoryPayloadDto dto, String actorUserId);

  EventDto updateWeddingDressCode(
      String eventId, WeddingDressCodePayloadDto dto, String actorUserId);

  EventDto updateWeddingGiftRegistry(
      String eventId, WeddingGiftRegistryPayloadDto dto, String actorUserId);

  EventDto updateWeddingParents(String eventId, WeddingParentsPayloadDto dto, String actorUserId);

  EventDto updateWeddingAccommodation(
      String eventId, WeddingAccommodationPayloadDto dto, String actorUserId);

  /** Internal use by other modules; no auth at this layer. */
  List<EventDto> findByOrganizer(String organizerUserId);

  /**
   * Cross-context read for invitation rendering. Skips ownership checks; the caller (invitation
   * module) is responsible for ensuring the requested eventId corresponds to a live, active
   * invitation before calling this method.
   */
  Optional<EventDto> findByEventId(String eventId);
}
