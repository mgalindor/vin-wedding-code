package com.vineyards.deerPlanner.invitation.application.port;

import com.vineyards.deerPlanner.invitation.domain.InvitationTemplate;
import java.util.List;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

@SecondaryPort
public interface InvitationTemplateRepository {

  List<InvitationTemplate> findByEventType(String eventType, boolean onlyActive);

  Optional<InvitationTemplate> findById(String id);

  InvitationTemplate save(InvitationTemplate template);
}
