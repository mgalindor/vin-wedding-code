package com.vineyards.deerPlanner.guests.outbound;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GuestGroupJpaRepository extends JpaRepository<GuestGroupEntity, String> {

    List<GuestGroupEntity> findByEventIdOrderByDisplayOrderAscNameAsc(String eventId);

    boolean existsByInvitationToken(String invitationToken);
}
