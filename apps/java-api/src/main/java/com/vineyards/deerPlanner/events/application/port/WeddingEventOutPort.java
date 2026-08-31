package com.vineyards.deerPlanner.events.application.port;

import com.vineyards.deerPlanner.events.domain.WeddingDetail;
import java.util.Optional;

/**
 * Persistence port for the wedding-specific 1:1 detail row ({@code wedding_events}). The base
 * {@link com.vineyards.deerPlanner.events.application.port.EventOutPort} knows nothing about
 * weddings — the {@link WeddingEventService} (or future equivalent) wires the two together when
 * composing the public invitation view.
 */
public interface WeddingEventOutPort {

  Optional<WeddingDetail> findByEventId(String eventId);

  void save(String eventId, WeddingDetail detail);

  void deleteByEventId(String eventId);
}
