package com.vineyards.deerPlanner.identity.outbound;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRoleJpaRepository extends JpaRepository<UserRoleEntity, UserRoleEntity.UserRoleId> {

    List<UserRoleEntity> findByUserId(String userId);
}
