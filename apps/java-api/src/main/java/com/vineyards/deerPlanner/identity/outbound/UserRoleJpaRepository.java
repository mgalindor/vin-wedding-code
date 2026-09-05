package com.vineyards.deerPlanner.identity.outbound;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRoleJpaRepository extends JpaRepository<UserRoleEntity, UserRoleId> {

  List<UserRoleEntity> findByIdUserId(String userId);

  /**
   * Bulk delete of every role row for a user. Uses a native query so the DELETE is sent to the
   * driver before the next batch, and clears the persistence context so the subsequent role INSERTs
   * are not merged into the (now-deleted) detached role rows from the same transaction — without
   * clearAutomatically, Hibernate tries to UPDATE the missing rows and throws
   * StaleObjectStateException.
   */
  @Modifying(clearAutomatically = true)
  @Query(value = "DELETE FROM user_roles WHERE user_id = :userId", nativeQuery = true)
  int deleteAllRolesForUser(@Param("userId") String userId);
}
