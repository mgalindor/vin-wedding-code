package com.vineyards.deerPlanner.invitation.application.port;

import com.vineyards.deerPlanner.invitation.domain.EventInvitationConfig;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

@SecondaryPort
public interface EventInvitationConfigOutPort {

  Optional<EventInvitationConfig> findByEventId(String eventId);

  /** Batch projection used to enrich event listings with the selected template, if any. */
  List<EventInvitationConfig> findByEventIds(Collection<String> eventIds);

  Optional<EventInvitationConfig> findBySlug(String slug);

  /** First-time creation of a config row for an event. Always inserts. */
  EventInvitationConfig create(EventInvitationConfig config);

  /** Persists changes to an already-existing config row. Always updates in place. */
  EventInvitationConfig update(EventInvitationConfig config);

  boolean existsBySlug(String slug);
}
