package com.vineyards.deerPlanner.events.application.port;

import com.vineyards.deerPlanner.events.domain.Event;
import java.util.List;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

/**
 * Secondary port the application layer uses to persist events. Implementations live in {@code
 * events/outbound/} as Spring Data adapters.
 */
@SecondaryPort
public interface EventRepository {

  Event save(Event event);

  Optional<Event> findById(String id);

  List<Event> findByOrganizerId(String organizerId);

  void deleteById(String id);
}
