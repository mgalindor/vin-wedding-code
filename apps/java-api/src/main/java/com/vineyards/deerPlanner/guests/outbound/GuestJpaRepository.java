package com.vineyards.deerPlanner.guests.outbound;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface GuestJpaRepository
    extends JpaRepository<GuestEntity, String>, JpaSpecificationExecutor<GuestEntity> {

  List<GuestEntity> findByGroupIdOrderByLastNameAscFirstNameAsc(String groupId);

  List<GuestEntity> findByGroupIdInOrderByLastNameAscFirstNameAsc(List<String> groupIds);

  Optional<GuestEntity> findByInvitationToken(String invitationToken);

  long countByGroupId(String groupId);
}
