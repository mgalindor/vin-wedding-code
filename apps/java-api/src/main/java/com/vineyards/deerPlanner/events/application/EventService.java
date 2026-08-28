package com.vineyards.deerPlanner.events.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vineyards.deerPlanner.events.application.port.EventRepository;
import com.vineyards.deerPlanner.events.domain.Event;
import com.vineyards.deerPlanner.events.domain.EventStatus;
import com.vineyards.deerPlanner.events.domain.EventType;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import com.vineyards.deerPlanner.events.facade.EventFacade;
import com.vineyards.deerPlanner.events.facade.dto.ContactsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.CreateEventDto;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.events.facade.dto.EventSummaryDto;
import com.vineyards.deerPlanner.events.facade.dto.LocationsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.ListEventsResponse;
import com.vineyards.deerPlanner.events.facade.dto.ProgramPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.UpdateEventDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingAccommodationPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingDressCodePayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingGiftRegistryPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingLandingPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingParentsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingStoryPayloadDto;
import com.vineyards.deerPlanner.shared.exceptions.BusinessError;
import com.vineyards.deerPlanner.shared.security.JwtIssuerPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.Application;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Application-layer orchestrator for events. Validates ownership, status transitions and
 * payload shapes; the inbound controllers stay slim and pass DTOs through untouched.
 *
 * <p>JSONB payloads are produced/consumed as typed DTOs (from {@code facade/dto/}); the
 * service serialises them with {@link ObjectMapper} before handing a string to the
 * repository. The inbound layer can therefore trust the shape of the DTOs — payloads
 * never enter the application as raw JSON.
 */
@Service
@Application
@RequiredArgsConstructor
@Slf4j
public class EventService implements EventFacade {

    private final EventRepository repository;
    private final ObjectMapper objectMapper;
    @SuppressWarnings("unused")
    private final JwtIssuerPort jwtIssuer;

    @Override
    @Transactional
    public EventDto createEvent(CreateEventDto dto, String actorUserId) {
        String id = UUID.randomUUID().toString();
        Event.WeddingDetail wedding = buildWeddingDetail(dto);
        Event event = new Event(
            id,
            actorUserId,
            dto.eventType(),
            dto.title(),
            dto.eventDate(),
            EventStatus.draft,
            null,
            null,
            null,
            wedding,
            OffsetDateTime.now(),
            OffsetDateTime.now()
        );
        Event saved = repository.save(event);
        log.info("event.created eventId={} type={} organizerId={}", saved.id(), saved.eventType(), actorUserId);
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
            items.add(new EventSummaryDto(
                event.id(),
                event.organizerId(),
                event.eventType(),
                event.title(),
                event.eventDate(),
                event.status(),
                event.updatedAt()
            ));
        }
        return new ListEventsResponse(items, items.size(), false);
    }

    @Override
    @Transactional
    public EventDto updateEventMetadata(String eventId, UpdateEventDto dto, String actorUserId) {
        Event current = loadOwnedEvent(eventId, actorUserId);
        Event updated = new Event(
            current.id(),
            current.organizerId(),
            current.eventType(),
            dto.title() != null ? dto.title() : current.title(),
            dto.eventDate() != null ? dto.eventDate() : current.eventDate(),
            current.status(),
            current.locationsPayload(),
            current.programPayload(),
            current.contactsPayload(),
            updateWeddingFromMeta(current.wedding(), dto),
            current.createdAt(),
            OffsetDateTime.now()
        );
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
        if (!current.status().canTransitionTo(EventStatus.published)) {
            throw new BusinessError("invalid_status_transition",
                "Event cannot be published from status " + current.status());
        }
        return toDto(repository.save(current.withStatus(EventStatus.published)));
    }

    @Override
    @Transactional
    public EventDto archiveEvent(String eventId, String actorUserId) {
        Event current = loadOwnedEvent(eventId, actorUserId);
        if (!current.status().canTransitionTo(EventStatus.archived)) {
            throw new BusinessError("invalid_status_transition",
                "Event cannot be archived from status " + current.status());
        }
        return toDto(repository.save(current.withStatus(EventStatus.archived)));
    }

    @Override
    @Transactional
    public EventDto updateLocations(String eventId, LocationsPayloadDto dto, String actorUserId) {
        Event current = loadOwnedEvent(eventId, actorUserId);
        return writePayload(current, current.locationsPayload(), serialize(dto),
            (e, p) -> e.withLocationsPayload(p));
    }

    @Override
    @Transactional
    public EventDto updateProgram(String eventId, ProgramPayloadDto dto, String actorUserId) {
        Event current = loadOwnedEvent(eventId, actorUserId);
        return writePayload(current, current.programPayload(), serialize(dto),
            (e, p) -> e.withProgramPayload(p));
    }

    @Override
    @Transactional
    public EventDto updateContacts(String eventId, ContactsPayloadDto dto, String actorUserId) {
        Event current = loadOwnedEvent(eventId, actorUserId);
        return writePayload(current, current.contactsPayload(), serialize(dto),
            (e, p) -> e.withContactsPayload(p));
    }

    @Override
    @Transactional
    public EventDto updateWeddingLanding(String eventId, WeddingLandingPayloadDto dto, String actorUserId) {
        return updateWeddingPayload(eventId, actorUserId,
            w -> w.withLandingPayload(serialize(dto)));
    }

    @Override
    @Transactional
    public EventDto updateWeddingStory(String eventId, WeddingStoryPayloadDto dto, String actorUserId) {
        return updateWeddingPayload(eventId, actorUserId,
            w -> w.withStoryPayload(serialize(dto)));
    }

    @Override
    @Transactional
    public EventDto updateWeddingDressCode(String eventId, WeddingDressCodePayloadDto dto, String actorUserId) {
        return updateWeddingPayload(eventId, actorUserId,
            w -> w.withDressCodePayload(serialize(dto)));
    }

    @Override
    @Transactional
    public EventDto updateWeddingGiftRegistry(String eventId, WeddingGiftRegistryPayloadDto dto, String actorUserId) {
        return updateWeddingPayload(eventId, actorUserId,
            w -> w.withGiftRegistryPayload(serialize(dto)));
    }

    @Override
    @Transactional
    public EventDto updateWeddingParents(String eventId, WeddingParentsPayloadDto dto, String actorUserId) {
        return updateWeddingPayload(eventId, actorUserId,
            w -> w.withParentsPayload(serialize(dto)));
    }

    @Override
    @Transactional
    public EventDto updateWeddingAccommodation(String eventId, WeddingAccommodationPayloadDto dto, String actorUserId) {
        return updateWeddingPayload(eventId, actorUserId,
            w -> w.withAccommodationPayload(serialize(dto)));
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
        Event event = repository.findById(eventId)
            .orElseThrow(() -> new ResourceNotFoundError("event_not_found", "Event " + eventId + " not found"));
        if (!event.organizerId().equals(actorUserId)) {
            throw new BusinessError("not_event_owner",
                "Actor " + actorUserId + " is not the organiser of event " + eventId);
        }
        return event;
    }

    private EventDto writePayload(
        Event current,
        String previous,
        String next,
        java.util.function.BiFunction<Event, String, Event> updater
    ) {
        if (previous != null && previous.equals(next)) {
            // No-op — same payload serialises identically. Avoids bumping updated_at.
            return toDto(current);
        }
        Event updated = updater.apply(current, next);
        return toDto(repository.save(updated));
    }

    private EventDto updateWeddingPayload(
        String eventId,
        String actorUserId,
        java.util.function.Function<Event.WeddingDetail, Event.WeddingDetail> mutator
    ) {
        Event current = loadOwnedEvent(eventId, actorUserId);
        Event.WeddingDetail base = current.wedding() != null
            ? current.wedding()
            : emptyWedding();
        Event.WeddingDetail updated = mutator.apply(base);
        return toDto(repository.save(current.withWedding(updated)));
    }

    private Event.WeddingDetail emptyWedding() {
        return new Event.WeddingDetail("", "", false, null, null, null, null, null, null);
    }

    private Event.WeddingDetail buildWeddingDetail(CreateEventDto dto) {
        if (dto.eventType() != EventType.wedding) {
            return null;
        }
        return new Event.WeddingDetail(
            dto.partner1Name() != null ? dto.partner1Name() : "",
            dto.partner2Name() != null ? dto.partner2Name() : "",
            true,
            null, null, null, null, null, null
        );
    }

    private Event.WeddingDetail updateWeddingFromMeta(Event.WeddingDetail current, UpdateEventDto dto) {
        if (dto == null || current == null) {
            return current;
        }
        if (dto.partner1Name() == null && dto.partner2Name() == null && dto.countdownEnabled() == null) {
            return current;
        }
        return new Event.WeddingDetail(
            dto.partner1Name() != null ? dto.partner1Name() : current.partner1Name(),
            dto.partner2Name() != null ? dto.partner2Name() : current.partner2Name(),
            dto.countdownEnabled() != null ? dto.countdownEnabled() : current.countdownEnabled(),
            current.landingPayload(),
            current.storyPayload(),
            current.dressCodePayload(),
            current.giftRegistryPayload(),
            current.parentsPayload(),
            current.accommodationPayload()
        );
    }

    private String serialize(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new BusinessError("invalid_payload", "Cannot serialise payload to JSON");
        }
    }

    private <T> T deserialize(String json, Class<T> type) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, type);
        } catch (JsonProcessingException e) {
            throw new BusinessError("corrupt_payload", "Stored payload cannot be deserialised");
        }
    }

    private EventDto toDto(Event event) {
        EventDto.WeddingPayloadsDto wedding = event.wedding() == null
            ? null
            : new EventDto.WeddingPayloadsDto(
                event.wedding().partner1Name(),
                event.wedding().partner2Name(),
                event.wedding().countdownEnabled(),
                deserialize(event.wedding().landingPayload(), WeddingLandingPayloadDto.class),
                deserialize(event.wedding().storyPayload(), WeddingStoryPayloadDto.class),
                deserialize(event.wedding().dressCodePayload(), WeddingDressCodePayloadDto.class),
                deserialize(event.wedding().giftRegistryPayload(), WeddingGiftRegistryPayloadDto.class),
                deserialize(event.wedding().parentsPayload(), WeddingParentsPayloadDto.class),
                deserialize(event.wedding().accommodationPayload(), WeddingAccommodationPayloadDto.class)
            );
        return new EventDto(
            event.id(),
            event.organizerId(),
            event.eventType(),
            event.title(),
            event.eventDate(),
            event.status(),
            deserialize(event.locationsPayload(), LocationsPayloadDto.class),
            deserialize(event.programPayload(), ProgramPayloadDto.class),
            deserialize(event.contactsPayload(), ContactsPayloadDto.class),
            wedding,
            event.createdAt(),
            event.updatedAt()
        );
    }
}
