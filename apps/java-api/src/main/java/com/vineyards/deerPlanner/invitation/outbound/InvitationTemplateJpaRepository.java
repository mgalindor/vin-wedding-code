package com.vineyards.deerPlanner.invitation.outbound;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InvitationTemplateJpaRepository
    extends JpaRepository<InvitationTemplateEntity, String> {

  List<InvitationTemplateEntity> findByEventTypeAndActiveOrderByDisplayOrderAsc(
      String eventType, boolean active);

  List<InvitationTemplateEntity> findByEventTypeOrderByDisplayOrderAsc(String eventType);

  List<InvitationTemplateEntity> findByActiveOrderByDisplayOrderAsc(boolean active);
}
