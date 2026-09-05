package com.vineyards.deerPlanner.guests.outbound;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GuestGroupJpaRepository extends JpaRepository<GuestGroupEntity, String> {

  List<GuestGroupEntity> findByEventIdOrderByDisplayOrderAscNameAsc(String eventId);

  boolean existsByInvitationToken(String invitationToken);

  Optional<GuestGroupEntity> findByInvitationToken(String invitationToken);
}
