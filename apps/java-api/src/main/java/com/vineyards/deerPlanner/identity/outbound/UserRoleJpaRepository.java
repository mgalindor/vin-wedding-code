package com.vineyards.deerPlanner.identity.outbound;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRoleJpaRepository extends JpaRepository<UserRoleEntity, UserRoleId> {

  List<UserRoleEntity> findByIdUserId(String userId);
}
