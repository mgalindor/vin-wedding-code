package com.vineyards.deerPlanner.invitation.application.port;

import com.vineyards.deerPlanner.invitation.domain.InvitationTemplate;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

import java.util.List;
import java.util.Optional;

@SecondaryPort
public interface InvitationTemplateRepository {

    List<InvitationTemplate> findByEventType(String eventType, boolean onlyActive);

    Optional<InvitationTemplate> findById(String id);

    InvitationTemplate save(InvitationTemplate template);
}
