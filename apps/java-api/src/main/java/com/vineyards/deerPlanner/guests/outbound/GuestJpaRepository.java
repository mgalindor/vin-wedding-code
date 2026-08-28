package com.vineyards.deerPlanner.guests.outbound;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GuestJpaRepository extends JpaRepository<GuestEntity, String> {

    List<GuestEntity> findByGroupIdOrderByLastNameAscFirstNameAsc(String groupId);

    List<GuestEntity> findByGroupIdInOrderByLastNameAscFirstNameAsc(List<String> groupIds);

    Optional<GuestEntity> findByInvitationToken(String invitationToken);

    long countByGroupId(String groupId);

    long countByGroupIdAndPrimaryIsTrue(String groupId);
}
