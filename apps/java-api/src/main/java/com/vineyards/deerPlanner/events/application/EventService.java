package com.vineyards.deerPlanner.events.application;

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
import com.vineyards.deerPlanner.events.facade.dto.UpdateEventDto;
import com.vineyards.deerPlanner.events.facade.mapper.EventPayloadMapper;
import com.vineyards.deerPlanner.events.outbound.EventEntity;
import com.vineyards.deerPlanner.shared.exceptions.BusinessError;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import com.vineyards.deerPlanner.shared.web.PagedResponse;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
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
 */
@Service
@Application
@RequiredArgsConstructor
@Slf4j
public class EventService implements EventInPort {

  private final EventOutPort repository;
  private final EventPayloadMapper payloadMapper;

  @Override
  @Transactional
  public EventDto createEvent(CreateEventDto dto, String actorUserId) {
    String id = UUID.randomUUID().toString();
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
  public PagedEventsResponse listOwnEvents(
      String actorUserId,
      String q,
      String status,
      String eventType,
      LocalDate eventDateFrom,
      LocalDate eventDateTo,
      Pageable pageable) {
    Specification<EventEntity> spec =
        Specification.where((root, query, cb) -> cb.equal(root.get("organizerId"), actorUserId));
    if (q != null && !q.isBlank()) {
      String pattern = "%" + q.toLowerCase().trim() + "%";
      spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("title")), pattern));
    }
    if (status != null && !status.isBlank()) {
      spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
    }
    if (eventType != null && !eventType.isBlank()) {
      spec = spec.and((root, query, cb) -> cb.equal(root.get("eventType"), eventType));
    }
    if (eventDateFrom != null) {
      spec =
          spec.and(
              (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("eventDate"), eventDateFrom));
    }
    if (eventDateTo != null) {
      spec =
          spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("eventDate"), eventDateTo));
    }
    Page<Event> page = repository.search(spec, pageable);
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
  public EventDto updateEventMetadata(String eventId, UpdateEventDto dto, String actorUserId) {
    Event current = loadOwnedEvent(eventId, actorUserId);
    if (dto.title() != null) current.setTitle(dto.title());
    if (dto.eventDate() != null) current.setEventDate(dto.eventDate());
    current.setUpdatedAt(Instant.now());
    return toDto(repository.save(current));
  }

  @Override
  @Transactional
  public void deleteEvent(String eventId, String actorUserId) {
    loadOwnedEvent(eventId, actorUserId);
    repository.deleteById(eventId);
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
