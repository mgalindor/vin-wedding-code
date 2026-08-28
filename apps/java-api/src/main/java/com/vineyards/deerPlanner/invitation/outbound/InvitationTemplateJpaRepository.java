package com.vineyards.deerPlanner.invitation.outbound;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvitationTemplateJpaRepository extends JpaRepository<InvitationTemplateEntity, String> {

    List<InvitationTemplateEntity> findByEventTypeAndActiveOrderByDisplayOrderAsc(String eventType, boolean active);

    List<InvitationTemplateEntity> findByEventTypeOrderByDisplayOrderAsc(String eventType);

    List<InvitationTemplateEntity> findByActiveOrderByDisplayOrderAsc(boolean active);
}
