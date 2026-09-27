package com.vineyards.deerPlanner.invitation.application.port;

import com.vineyards.deerPlanner.invitation.domain.InvitationTemplate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

@SecondaryPort
public interface InvitationTemplateOutPort {

  List<InvitationTemplate> findByEventType(String eventType, boolean onlyActive);

  Optional<InvitationTemplate> findById(String id);

  /** Batch projection used to resolve template codes for an event listing page. */
  List<InvitationTemplate> findAllByIds(Collection<String> ids);

  InvitationTemplate save(InvitationTemplate template);
}
