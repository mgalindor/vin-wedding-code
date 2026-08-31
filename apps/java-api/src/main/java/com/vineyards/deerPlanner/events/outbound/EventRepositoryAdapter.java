package com.vineyards.deerPlanner.events.outbound;

import com.vineyards.deerPlanner.events.application.port.EventOutPort;
import com.vineyards.deerPlanner.events.domain.Event;
import com.vineyards.deerPlanner.events.domain.EventType;
import com.vineyards.deerPlanner.events.domain.WeddingDetail;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Adapts the {@link EventOutPort} port to PostgreSQL via two JPA repositories: {@code events}
 * (shared columns) and {@code wedding_events} (1:1 detail). The 1:1 read is composed in Java (no
 * Hibernate relationships) to keep the entity model explicit and avoids lazy-init traps on the
 * secondary side.
 */
@Component
@SecondaryAdapter
@RequiredArgsConstructor
@Slf4j
public class EventRepositoryAdapter implements EventOutPort {

  private final EventJpaRepository eventJpa;
  private final WeddingEventJpaRepository weddingJpa;

  @Override
  @Transactional
  public Event save(Event event) {
    EventEntity entity = toEntity(event);
    EventEntity saved = eventJpa.save(entity);

    if (event.getEventType() == EventType.wedding) {
      weddingJpa.save(toWeddingEntity(event.getId(), event.getWedding()));
    } else if (event.getWedding() == null) {
      // Defensive: a non-wedding event should not leave a stale wedding row.
      weddingJpa.findById(event.getId()).ifPresent(weddingJpa::delete);
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
    WeddingEventEntity wedding =
        entity.get().getEventType().equals(EventType.wedding.name())
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
      WeddingEventEntity wedding =
          entity.getEventType().equals(EventType.wedding.name())
              ? weddingJpa.findById(entity.getId()).orElse(null)
              : null;
      out.add(toDomain(entity, wedding));
    }
    return out;
  }

  @Override
  @Transactional
  public void deleteById(String id) {
    // wedding row lives on the same PK + ON DELETE CASCADE â€” no manual cleanup required.
    eventJpa.deleteById(id);
  }

  private Event toDomain(EventEntity entity, WeddingEventEntity wedding) {
    EventType type = EventType.fromString(entity.getEventType());
    WeddingDetail detail =
        wedding == null
            ? null
            : WeddingDetail.builder()
                .partner1Name(wedding.getPartner1Name())
                .partner2Name(wedding.getPartner2Name())
                .countdownEnabled(wedding.isCountdownEnabled())
                .landingPayload(wedding.getLandingPayload())
                .storyPayload(wedding.getStoryPayload())
                .dressCodePayload(wedding.getDressCodePayload())
                .giftRegistryPayload(wedding.getGiftRegistryPayload())
                .parentsPayload(wedding.getParentsPayload())
                .accommodationPayload(wedding.getAccommodationPayload())
                .build();
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
        entity.getUpdatedAt());
  }

  private EventEntity toEntity(Event event) {
    EventEntity entity = new EventEntity();
    entity.setId(event.getId());
    entity.setOrganizerId(event.getOrganizerId());
    entity.setEventType(event.getEventType().name());
    entity.setTitle(event.getTitle());
    entity.setEventDate(event.getEventDate());
    entity.setStatus(event.getStatus().name());
    entity.setLocationsPayload(event.getLocationsPayload());
    entity.setProgramPayload(event.getProgramPayload());
    entity.setContactsPayload(event.getContactsPayload());
    return entity;
  }

  private WeddingEventEntity toWeddingEntity(String eventId, WeddingDetail d) {
    WeddingEventEntity w = new WeddingEventEntity();
    w.setEventId(eventId);
    w.setPartner1Name(d.getPartner1Name());
    w.setPartner2Name(d.getPartner2Name());
    w.setCountdownEnabled(d.isCountdownEnabled());
    w.setLandingPayload(d.getLandingPayload());
    w.setStoryPayload(d.getStoryPayload());
    w.setDressCodePayload(d.getDressCodePayload());
    w.setGiftRegistryPayload(d.getGiftRegistryPayload());
    w.setParentsPayload(d.getParentsPayload());
    w.setAccommodationPayload(d.getAccommodationPayload());
    return w;
  }
}
