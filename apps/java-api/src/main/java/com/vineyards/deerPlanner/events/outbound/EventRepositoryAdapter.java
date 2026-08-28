package com.vineyards.deerPlanner.events.outbound;

import com.vineyards.deerPlanner.events.application.port.EventRepository;
import com.vineyards.deerPlanner.events.domain.Event;
import com.vineyards.deerPlanner.events.domain.EventType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Adapts the {@link EventRepository} port to PostgreSQL via two JPA repositories:
 * {@code events} (shared columns) and {@code wedding_events} (1:1 detail). The 1:1 read
 * is composed in Java (no Hibernate relationships) per blueprint §8 — keeps the entity model
 * explicit and avoids lazy-init traps on the secondary side.
 */
@Component
@SecondaryAdapter
@RequiredArgsConstructor
@Slf4j
public class EventRepositoryAdapter implements EventRepository {

    private final EventJpaRepository eventJpa;
    private final WeddingEventJpaRepository weddingJpa;

    @Override
    @Transactional
    public Event save(Event event) {
        EventEntity entity = toEntity(event);
        EventEntity saved = eventJpa.save(entity);

        if (event.eventType() == EventType.wedding) {
            weddingJpa.save(toWeddingEntity(event.id(), event.wedding()));
        } else if (event.wedding() == null) {
            // Defensive: a non-wedding event should not leave a stale wedding row.
            weddingJpa.findById(event.id()).ifPresent(weddingJpa::delete);
        }

        return toDomain(saved, weddingJpa.findById(saved.getId()).orElse(null));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Event> findById(String id) {
        Optional<EventEntity> entity = eventJpa.findById(id);
        if (entity.isEmpty()) {
            return Optional.empty();
        }
        WeddingEventEntity wedding = entity.get().getEventType().equals(EventType.wedding.name())
            ? weddingJpa.findById(id).orElse(null)
            : null;
        return Optional.of(toDomain(entity.get(), wedding));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Event> findByOrganizerId(String organizerId) {
        List<EventEntity> entities = eventJpa.findByOrganizerIdOrderByEventDateDesc(organizerId);
        List<Event> out = new ArrayList<>(entities.size());
        for (EventEntity entity : entities) {
            WeddingEventEntity wedding = entity.getEventType().equals(EventType.wedding.name())
                ? weddingJpa.findById(entity.getId()).orElse(null)
                : null;
            out.add(toDomain(entity, wedding));
        }
        return out;
    }

    @Override
    @Transactional
    public void deleteById(String id) {
        // wedding row lives on the same PK + ON DELETE CASCADE — no manual cleanup required.
        eventJpa.deleteById(id);
    }

    private Event toDomain(EventEntity entity, WeddingEventEntity wedding) {
        EventType type = EventType.fromString(entity.getEventType());
        Event.WeddingDetail detail = wedding == null
            ? null
            : new Event.WeddingDetail(
                wedding.getPartner1Name(),
                wedding.getPartner2Name(),
                wedding.isCountdownEnabled(),
                wedding.getLandingPayload(),
                wedding.getStoryPayload(),
                wedding.getDressCodePayload(),
                wedding.getGiftRegistryPayload(),
                wedding.getParentsPayload(),
                wedding.getAccommodationPayload()
            );
        return new Event(
            entity.getId(),
            entity.getOrganizerId(),
            type,
            entity.getTitle(),
            entity.getEventDate(),
            com.vineyards.deerPlanner.events.domain.EventStatus.valueOf(entity.getStatus()),
            entity.getLocationsPayload(),
            entity.getProgramPayload(),
            entity.getContactsPayload(),
            detail,
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    private EventEntity toEntity(Event event) {
        EventEntity entity = new EventEntity();
        entity.setId(event.id());
        entity.setOrganizerId(event.organizerId());
        entity.setEventType(event.eventType().name());
        entity.setTitle(event.title());
        entity.setEventDate(event.eventDate());
        entity.setStatus(event.status().name());
        entity.setLocationsPayload(event.locationsPayload());
        entity.setProgramPayload(event.programPayload());
        entity.setContactsPayload(event.contactsPayload());
        return entity;
    }

    private WeddingEventEntity toWeddingEntity(String eventId, Event.WeddingDetail d) {
        WeddingEventEntity w = new WeddingEventEntity();
        w.setEventId(eventId);
        w.setPartner1Name(d.partner1Name());
        w.setPartner2Name(d.partner2Name());
        w.setCountdownEnabled(d.countdownEnabled());
        w.setLandingPayload(d.landingPayload());
        w.setStoryPayload(d.storyPayload());
        w.setDressCodePayload(d.dressCodePayload());
        w.setGiftRegistryPayload(d.giftRegistryPayload());
        w.setParentsPayload(d.parentsPayload());
        w.setAccommodationPayload(d.accommodationPayload());
        return w;
    }
}
