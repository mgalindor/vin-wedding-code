package com.vineyards.deerPlanner.invitation.application.port;

import com.vineyards.deerPlanner.invitation.domain.EventInvitationConfig;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

import java.util.Optional;

@SecondaryPort
public interface EventInvitationConfigRepository {

    Optional<EventInvitationConfig> findByEventId(String eventId);

    Optional<EventInvitationConfig> findBySlug(String slug);

    EventInvitationConfig save(EventInvitationConfig config);

    boolean existsBySlug(String slug);
}
