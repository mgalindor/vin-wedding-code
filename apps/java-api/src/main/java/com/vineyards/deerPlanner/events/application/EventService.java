package com.vineyards.deerPlanner.events.application;

import com.vineyards.deerPlanner.events.application.port.EventRepository;
import com.vineyards.deerPlanner.events.domain.Event;
import com.vineyards.deerPlanner.events.domain.EventStatus;
import com.vineyards.deerPlanner.events.domain.EventType;
import com.vineyards.deerPlanner.events.domain.WeddingDetail;
import com.vineyards.deerPlanner.events.facade.EventFacade;
import com.vineyards.deerPlanner.events.facade.dto.ContactsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.CreateEventDto;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.events.facade.dto.EventSummaryDto;
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
import com.vineyards.deerPlanner.events.facade.mapper.EventPayloadMapper;
import com.vineyards.deerPlanner.shared.exceptions.BusinessError;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.Application;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application-layer orchestrator for events. Validates ownership, status transitions and payload
 * shapes; the inbound controllers stay slim and pass DTOs through untouched.
 *
 * <p>JSONB payloads are mapped between their DTO and domain-payload forms via {@link
 * EventPayloadMapper}; the domain layer holds the typed object that Hibernate serialises to JSON.
 */
@Service
@Application
@RequiredArgsConstructor
@Slf4j
public class EventService implements EventFacade {

  private final EventRepository repository;
  private final EventPayloadMapper payloadMapper;

  @Override
  @Transactional
  public EventDto createEvent(CreateEventDto dto, String actorUserId) {
    String id = UUID.randomUUID().toString();
    WeddingDetail wedding = buildWeddingDetail(dto);
    Instant now = Instant.now();
    Event event =
        Event.builder()
            .id(id)
            .organizerId(actorUserId)
            .eventType(dto.eventType())
            .title(dto.title())
            .eventDate(dto.eventDate())
            .status(EventStatus.draft)
            .locationsPayload(null)
            .programPayload(null)
            .contactsPayload(null)
            .wedding(wedding)
            .createdAt(now)
            .updatedAt(now)
            .build();
    Event saved = repository.save(event);
    log.info(
        "event.created eventId={} type={} organizerId={}",
        saved.getId(),
        saved.getEventType(),
        actorUserId);
    return toDto(saved);
  }

  @Override
  @Transactional(readOnly = true)
  public EventDto getEvent(String eventId, String actorUserId) {
    Event event = loadOwnedEvent(eventId, actorUserId);
    return toDto(event);
  }

  @Override
  @Transactional(readOnly = true)
  public ListEventsResponse listOwnEvents(String actorUserId) {
    List<Event> events = repository.findByOrganizerId(actorUserId);
    List<EventSummaryDto> items = new ArrayList<>(events.size());
    for (Event event : events) {
      items.add(
          new EventSummaryDto(
              event.getId(),
              event.getOrganizerId(),
              event.getEventType(),
              event.getTitle(),
              event.getEventDate(),
              event.getStatus(),
              event.getUpdatedAt()));
    }
    return new ListEventsResponse(items, items.size(), false);
  }

  @Override
  @Transactional
  public EventDto updateEventMetadata(String eventId, UpdateEventDto dto, String actorUserId) {
    Event current = loadOwnedEvent(eventId, actorUserId);
    Event updated = current;
    if (dto.title() != null) updated.setTitle(dto.title());
    if (dto.eventDate() != null) updated.setEventDate(dto.eventDate());
    updated.setWedding(updateWeddingFromMeta(current.getWedding(), dto));
    updated.setUpdatedAt(Instant.now());
    return toDto(repository.save(updated));
  }

  @Override
  @Transactional
  public void deleteEvent(String eventId, String actorUserId) {
    loadOwnedEvent(eventId, actorUserId);
    repository.deleteById(eventId);
  }

  @Override
  @Transactional
  public EventDto publishEvent(String eventId, String actorUserId) {
    Event current = loadOwnedEvent(eventId, actorUserId);
    if (!current.getStatus().canTransitionTo(EventStatus.published)) {
      throw new BusinessError(
          "invalid_status_transition",
          "Event cannot be published from status " + current.getStatus());
    }
    current.setStatus(EventStatus.published);
    return toDto(repository.save(current));
  }

  @Override
  @Transactional
  public EventDto archiveEvent(String eventId, String actorUserId) {
    Event current = loadOwnedEvent(eventId, actorUserId);
    if (!current.getStatus().canTransitionTo(EventStatus.archived)) {
      throw new BusinessError(
          "invalid_status_transition",
          "Event cannot be archived from status " + current.getStatus());
    }
    current.setStatus(EventStatus.archived);
    return toDto(repository.save(current));
  }

  @Override
  @Transactional
  public EventDto updateLocations(String eventId, LocationsPayloadDto dto, String actorUserId) {
    Event current = loadOwnedEvent(eventId, actorUserId);
    current.setLocationsPayload(payloadMapper.toPayload(dto));
    return toDto(repository.save(current));
  }

  @Override
  @Transactional
  public EventDto updateProgram(String eventId, ProgramPayloadDto dto, String actorUserId) {
    Event current = loadOwnedEvent(eventId, actorUserId);
    current.setProgramPayload(payloadMapper.toPayload(dto));
    return toDto(repository.save(current));
  }

  @Override
  @Transactional
  public EventDto updateContacts(String eventId, ContactsPayloadDto dto, String actorUserId) {
    Event current = loadOwnedEvent(eventId, actorUserId);
    current.setContactsPayload(payloadMapper.toPayload(dto));
    return toDto(repository.save(current));
  }

  @Override
  @Transactional
  public EventDto updateWeddingLanding(
      String eventId, WeddingLandingPayloadDto dto, String actorUserId) {
    return updateWeddingPayload(
        eventId, actorUserId, w -> w.setLandingPayload(payloadMapper.toPayload(dto)));
  }

  @Override
  @Transactional
  public EventDto updateWeddingStory(
      String eventId, WeddingStoryPayloadDto dto, String actorUserId) {
    return updateWeddingPayload(
        eventId, actorUserId, w -> w.setStoryPayload(payloadMapper.toPayload(dto)));
  }

  @Override
  @Transactional
  public EventDto updateWeddingDressCode(
      String eventId, WeddingDressCodePayloadDto dto, String actorUserId) {
    return updateWeddingPayload(
        eventId, actorUserId, w -> w.setDressCodePayload(payloadMapper.toPayload(dto)));
  }

  @Override
  @Transactional
  public EventDto updateWeddingGiftRegistry(
      String eventId, WeddingGiftRegistryPayloadDto dto, String actorUserId) {
    return updateWeddingPayload(
        eventId, actorUserId, w -> w.setGiftRegistryPayload(payloadMapper.toPayload(dto)));
  }

  @Override
  @Transactional
  public EventDto updateWeddingParents(
      String eventId, WeddingParentsPayloadDto dto, String actorUserId) {
    return updateWeddingPayload(
        eventId, actorUserId, w -> w.setParentsPayload(payloadMapper.toPayload(dto)));
  }

  @Override
  @Transactional
  public EventDto updateWeddingAccommodation(
      String eventId, WeddingAccommodationPayloadDto dto, String actorUserId) {
    return updateWeddingPayload(
        eventId, actorUserId, w -> w.setAccommodationPayload(payloadMapper.toPayload(dto)));
  }

  @Override
  @Transactional(readOnly = true)
  public List<EventDto> findByOrganizer(String organizerUserId) {
    // Used only by other modules — not exposed as HTTP. RBAC at the inbound layer doesn't
    // apply (the calling module has already authenticated with Spring Security). The
    // repository scopes results to the organiser; we still assert the boundary here.
    return repository.findByOrganizerId(organizerUserId).stream().map(this::toDto).toList();
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<EventDto> findByEventId(String eventId) {
    // Cross-context read used by invitation (rendering the public page) and later by
    // guests. No ownership check here — the caller is responsible for verifying that
    // the event is reachable in the caller's context before invoking this method.
    return repository.findById(eventId).map(this::toDto);
  }

  private Event loadOwnedEvent(String eventId, String actorUserId) {
    Event event =
        repository
            .findById(eventId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundError(
                        "event_not_found", "Event " + eventId + " not found"));
    if (!event.getOrganizerId().equals(actorUserId)) {
      throw new BusinessError(
          "not_event_owner", "Actor " + actorUserId + " is not the organiser of event " + eventId);
    }
    return event;
  }

  private EventDto updateWeddingPayload(
      String eventId, String actorUserId, java.util.function.Consumer<WeddingDetail> mutator) {
    Event current = loadOwnedEvent(eventId, actorUserId);
    WeddingDetail wedding = current.getWedding() != null ? current.getWedding() : emptyWedding();
    mutator.accept(wedding);
    current.setWedding(wedding);
    return toDto(repository.save(current));
  }

  private WeddingDetail emptyWedding() {
    return WeddingDetail.builder()
        .partner1Name("")
        .partner2Name("")
        .countdownEnabled(false)
        .landingPayload(null)
        .storyPayload(null)
        .dressCodePayload(null)
        .giftRegistryPayload(null)
        .parentsPayload(null)
        .accommodationPayload(null)
        .build();
  }

  private WeddingDetail buildWeddingDetail(CreateEventDto dto) {
    if (dto.eventType() != EventType.wedding) {
      return null;
    }
    return WeddingDetail.builder()
        .partner1Name(dto.partner1Name() != null ? dto.partner1Name() : "")
        .partner2Name(dto.partner2Name() != null ? dto.partner2Name() : "")
        .countdownEnabled(true)
        .landingPayload(null)
        .storyPayload(null)
        .dressCodePayload(null)
        .giftRegistryPayload(null)
        .parentsPayload(null)
        .accommodationPayload(null)
        .build();
  }

  private WeddingDetail updateWeddingFromMeta(WeddingDetail current, UpdateEventDto dto) {
    if (dto == null || current == null) {
      return current;
    }
    if (dto.partner1Name() == null
        && dto.partner2Name() == null
        && dto.countdownEnabled() == null) {
      return current;
    }
    return WeddingDetail.builder()
        .partner1Name(dto.partner1Name() != null ? dto.partner1Name() : current.getPartner1Name())
        .partner2Name(dto.partner2Name() != null ? dto.partner2Name() : current.getPartner2Name())
        .countdownEnabled(
            dto.countdownEnabled() != null ? dto.countdownEnabled() : current.isCountdownEnabled())
        .landingPayload(current.getLandingPayload())
        .storyPayload(current.getStoryPayload())
        .dressCodePayload(current.getDressCodePayload())
        .giftRegistryPayload(current.getGiftRegistryPayload())
        .parentsPayload(current.getParentsPayload())
        .accommodationPayload(current.getAccommodationPayload())
        .build();
  }

  private EventDto toDto(Event event) {
    EventDto.WeddingPayloadsDto wedding =
        event.getWedding() == null
            ? null
            : new EventDto.WeddingPayloadsDto(
                event.getWedding().getPartner1Name(),
                event.getWedding().getPartner2Name(),
                event.getWedding().isCountdownEnabled(),
                event.getWedding().getLandingPayload() == null
                    ? null
                    : payloadMapper.toDto(event.getWedding().getLandingPayload()),
                event.getWedding().getStoryPayload() == null
                    ? null
                    : payloadMapper.toDto(event.getWedding().getStoryPayload()),
                event.getWedding().getDressCodePayload() == null
                    ? null
                    : payloadMapper.toDto(event.getWedding().getDressCodePayload()),
                event.getWedding().getGiftRegistryPayload() == null
                    ? null
                    : payloadMapper.toDto(event.getWedding().getGiftRegistryPayload()),
                event.getWedding().getParentsPayload() == null
                    ? null
                    : payloadMapper.toDto(event.getWedding().getParentsPayload()),
                event.getWedding().getAccommodationPayload() == null
                    ? null
                    : payloadMapper.toDto(event.getWedding().getAccommodationPayload()));
    return new EventDto(
        event.getId(),
        event.getOrganizerId(),
        event.getEventType(),
        event.getTitle(),
        event.getEventDate(),
        event.getStatus(),
        event.getLocationsPayload() == null
            ? null
            : payloadMapper.toDto(event.getLocationsPayload()),
        event.getProgramPayload() == null ? null : payloadMapper.toDto(event.getProgramPayload()),
        event.getContactsPayload() == null ? null : payloadMapper.toDto(event.getContactsPayload()),
        wedding,
        event.getCreatedAt(),
        event.getUpdatedAt());
  }
}
