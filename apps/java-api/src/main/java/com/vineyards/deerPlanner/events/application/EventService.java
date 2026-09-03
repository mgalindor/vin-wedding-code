package com.vineyards.deerPlanner.events.application;

import com.vineyards.deerPlanner.events.application.port.EventFilter;
import com.vineyards.deerPlanner.events.application.port.EventOutPort;
import com.vineyards.deerPlanner.events.domain.Event;
import com.vineyards.deerPlanner.events.domain.EventStatus;
import com.vineyards.deerPlanner.events.facade.EventInPort;
import com.vineyards.deerPlanner.events.facade.dto.ContactsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.CreateEventDto;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.events.facade.dto.EventSummaryDto;
import com.vineyards.deerPlanner.events.facade.dto.LocationsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.PagedEventsResponse;
import com.vineyards.deerPlanner.events.facade.dto.ProgramPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.ReassignOrganizerDto;
import com.vineyards.deerPlanner.events.facade.dto.UpdateEventDto;
import com.vineyards.deerPlanner.events.facade.mapper.EventPayloadMapper;
import com.vineyards.deerPlanner.identity.facade.UserInPort;
import com.vineyards.deerPlanner.shared.exceptions.BusinessError;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import com.vineyards.deerPlanner.shared.web.PagedResponse;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application-layer orchestrator for the generic event lifecycle: create, read, update metadata,
 * state transitions, and the 3 type-agnostic JSONB payloads (locations, program, contacts).
 * Type-specific state (wedding, birthday, anniversary, ...) lives behind its own service — see
 * {@link WeddingEventService} for the pattern.
 *
 * <p>JSONB payloads are mapped between their DTO and domain-payload forms via {@link
 * EventPayloadMapper}; the domain layer holds the typed object that Hibernate serialises to JSON.
 *
 * <p>Authorisation is enforced at the inbound layer via SpEL {@code @PreAuthorize} (admin OR
 * owner). The service trusts the caller and loads events by id only.
 */
@Service
@Application
@RequiredArgsConstructor
@Slf4j
public class EventService implements EventInPort {

  private final EventOutPort repository;
  private final EventPayloadMapper payloadMapper;
  private final UserInPort userApi;

  @Override
  @Transactional
  public EventDto createEvent(CreateEventDto dto, String actorUserId) {
    Instant now = Instant.now();
    Event event =
        Event.builder()
            .organizerId(actorUserId)
            .eventType(dto.eventType())
            .title(dto.title())
            .eventDate(dto.eventDate())
            .status(EventStatus.draft)
            .locationsPayload(null)
            .programPayload(null)
            .contactsPayload(null)
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
  public EventDto getEvent(String eventId) {
    return toDto(loadEvent(eventId));
  }

  @Override
  @Transactional(readOnly = true)
  public PagedEventsResponse listOwnEvents(
      String actorUserId,
      boolean actorIsAdmin,
      String q,
      String status,
      String eventType,
      LocalDate eventDateFrom,
      LocalDate eventDateTo,
      Pageable pageable) {
    // Admin scope: pass no organizerId (null = unfiltered). Organiser scope: scope to the actor.
    // The adapter translates the technology-agnostic EventFilter into a JPA Specification.
    EventFilter filter =
        actorIsAdmin
            ? EventFilter.unscoped(q, status, eventType, eventDateFrom, eventDateTo)
            : EventFilter.forOrganizer(
                actorUserId, q, status, eventType, eventDateFrom, eventDateTo);
    Page<Event> page = repository.search(filter, pageable);
    PagedResponse<EventSummaryDto> mapped = PagedResponse.from(page, EventService::toSummary);
    return new PagedEventsResponse(mapped);
  }

  private static EventSummaryDto toSummary(Event event) {
    return new EventSummaryDto(
        event.getId(),
        event.getOrganizerId(),
        event.getEventType(),
        event.getTitle(),
        event.getEventDate(),
        event.getStatus(),
        event.getUpdatedAt());
  }

  @Override
  @Transactional
  public EventDto updateEventMetadata(String eventId, UpdateEventDto dto) {
    Event current = loadEvent(eventId);
    if (dto.title() != null) current.setTitle(dto.title());
    if (dto.eventDate() != null) current.setEventDate(dto.eventDate());
    current.setUpdatedAt(Instant.now());
    return toDto(repository.save(current));
  }

  @Override
  @Transactional
  public void deleteEvent(String eventId) {
    loadEvent(eventId);
    repository.deleteById(eventId);
  }

  @Override
  @Transactional
  public EventDto archiveEvent(String eventId) {
    Event current = loadEvent(eventId);
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
  public EventDto updateLocations(String eventId, LocationsPayloadDto dto) {
    Event current = loadEvent(eventId);
    current.setLocationsPayload(payloadMapper.toPayload(dto));
    return toDto(repository.save(current));
  }

  @Override
  @Transactional
  public EventDto updateProgram(String eventId, ProgramPayloadDto dto) {
    Event current = loadEvent(eventId);
    current.setProgramPayload(payloadMapper.toPayload(dto));
    return toDto(repository.save(current));
  }

  @Override
  @Transactional
  public EventDto updateContacts(String eventId, ContactsPayloadDto dto) {
    Event current = loadEvent(eventId);
    current.setContactsPayload(payloadMapper.toPayload(dto));
    return toDto(repository.save(current));
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
  @Transactional
  public EventDto reassignOrganizer(String eventId, ReassignOrganizerDto dto, String actorUserId) {
    // Validate the target user is real, active, and not soft-deleted. The DTO already
    // guarantees non-blank, but @NotBlank doesn't cover whitespace-only strings.
    String newOrganizerId = dto.organizerId() == null ? "" : dto.organizerId().trim();
    if (newOrganizerId.isEmpty()) {
      throw new BusinessError("organizer_id_required", "organizerId is required");
    }
    if (!userApi.existsActiveUser(newOrganizerId)) {
      throw new ResourceNotFoundError("user", newOrganizerId);
    }
    Event event = loadEvent(eventId);
    String oldOrganizerId = event.getOrganizerId();
    if (oldOrganizerId.equals(newOrganizerId)) {
      // Idempotent no-op — return the current state without an UPDATE on the row.
      return toDto(event);
    }
    event.setOrganizerId(newOrganizerId);
    event.setUpdatedAt(Instant.now());
    Event saved = repository.save(event);
    log.info(
        "event.organizer_reassigned eventId={} oldOrganizerId={} newOrganizerId={} actorUserId={}",
        saved.getId(),
        oldOrganizerId,
        newOrganizerId,
        actorUserId);
    return toDto(saved);
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<EventDto> findByEventId(String eventId) {
    // Cross-context read used by invitation (rendering the public page) and later by
    // guests. No ownership check here — the caller is responsible for verifying that
    // the event is reachable in the caller's context before invoking this method.
    return repository.findById(eventId).map(this::toDto);
  }

  private Event loadEvent(String eventId) {
    return repository
        .findById(eventId)
        .orElseThrow(
            () -> new ResourceNotFoundError("event_not_found", "Event " + eventId + " not found"));
  }

  private EventDto toDto(Event event) {
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
        event.getCreatedAt(),
        event.getUpdatedAt());
  }
}
