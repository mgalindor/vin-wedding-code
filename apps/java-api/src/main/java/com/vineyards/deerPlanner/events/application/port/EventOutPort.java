package com.vineyards.deerPlanner.events.application.port;

import com.vineyards.deerPlanner.events.domain.Event;
import com.vineyards.deerPlanner.events.outbound.EventEntity;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.SecondaryPort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

/**
 * Secondary port the application layer uses to persist events. Implementations live in {@code
 * events/outbound/} as Spring Data adapters.
 */
@SecondaryPort
public interface EventOutPort {

  Event save(Event event);

  Optional<Event> findById(String id);

  /**
   * Paginated, filterable search over the event table. The service builds the specification from
   * the organiser's filter parameters (q, status, eventType, eventDate range) before calling here.
   */
  Page<Event> search(Specification<EventEntity> spec, Pageable pageable);

  /** Non-paginated lookup for cross-module use (e.g. invitation rendering). */
  java.util.List<Event> findByOrganizerId(String organizerId);

  void deleteById(String id);
}
