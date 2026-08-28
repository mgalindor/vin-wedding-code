package com.vineyards.deerPlanner.invitation.outbound;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EventInvitationConfigJpaRepository extends JpaRepository<EventInvitationConfigEntity, String> {

    Optional<EventInvitationConfigEntity> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
