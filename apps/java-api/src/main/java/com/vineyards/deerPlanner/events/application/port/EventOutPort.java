package com.vineyards.deerPlanner.events.application.port;

import com.vineyards.deerPlanner.events.domain.Event;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.SecondaryPort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Secondary port the application layer uses to persist events. Implementations live in {@code
 * events/outbound/} as Spring Data adapters.
 */
@SecondaryPort
public interface EventOutPort {

  /** First-time creation of an event row. Always inserts. */
  Event create(Event event);

  /** Persists changes to an already-existing event row. Always updates in place. */
  Event update(Event event);

  Optional<Event> findById(String id);

  /**
   * Paginated, filterable search over the event table. {@link EventFilter} is a technology-agnostic
   * value object — the adapter (not the application) translates it into the persistence query.
   */
  Page<Event> search(EventFilter filter, Pageable pageable);

  /**
   * Non-paginated lookup of every event for one organiser. Used cross-module (invitation rendering)
   * where filters and pagination are unnecessary; kept on the port as a focused read rather than
   * overloading {@link #search} with a sentinel "no pageable" mode.
   */
  java.util.List<Event> findByOrganizerId(String organizerId);

  void deleteById(String id);
}
