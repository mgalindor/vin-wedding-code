package com.vineyards.deerPlanner.events.outbound;

import com.vineyards.deerPlanner.events.application.port.EventOutPort;
import com.vineyards.deerPlanner.events.domain.Event;
import com.vineyards.deerPlanner.events.domain.EventStatus;
import com.vineyards.deerPlanner.events.domain.EventType;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Adapts {@link EventOutPort} to PostgreSQL via the {@code events} table only. Wedding-specific
 * state lives in the {@code wedding_events} table and is owned by {@link
 * WeddingEventRepositoryAdapter} — this adapter knows nothing about it, so the base event flow
 * stays generic.
 */
@Component
@SecondaryAdapter
@RequiredArgsConstructor
@Slf4j
public class EventRepositoryAdapter implements EventOutPort {

  private final EventJpaRepository eventJpa;

  @Override
  @Transactional
  public Event save(Event event) {
    EventEntity entity = toEntity(event);
    EventEntity saved = eventJpa.save(entity);
    return toDomain(saved);
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<Event> findById(String id) {
    return eventJpa.findById(id).map(this::toDomain);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<Event> search(Specification<EventEntity> spec, Pageable pageable) {
    return eventJpa.findAll(spec, pageable).map(this::toDomain);
  }

  @Override
  @Transactional(readOnly = true)
  public java.util.List<Event> findByOrganizerId(String organizerId) {
    return eventJpa.findByOrganizerIdOrderByEventDateDesc(organizerId).stream()
        .map(this::toDomain)
        .toList();
  }

  @Override
  @Transactional
  public void deleteById(String id) {
    eventJpa.deleteById(id);
  }

  private Event toDomain(EventEntity entity) {
    return new Event(
        entity.getId(),
        entity.getOrganizerId(),
        EventType.fromString(entity.getEventType()),
        entity.getTitle(),
        entity.getEventDate(),
        EventStatus.valueOf(entity.getStatus()),
        entity.getLocationsPayload(),
        entity.getProgramPayload(),
        entity.getContactsPayload(),
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
}
