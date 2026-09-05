package com.vineyards.deerPlanner.invitation.outbound;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventInvitationConfigJpaRepository
    extends JpaRepository<EventInvitationConfigEntity, String> {

  Optional<EventInvitationConfigEntity> findBySlug(String slug);

  boolean existsBySlug(String slug);
}
