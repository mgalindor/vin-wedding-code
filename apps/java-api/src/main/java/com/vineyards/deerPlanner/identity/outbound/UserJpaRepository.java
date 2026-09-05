package com.vineyards.deerPlanner.identity.outbound;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserJpaRepository
    extends JpaRepository<UserEntity, String>, JpaSpecificationExecutor<UserEntity> {

  // Returns the user row by username, including disabled ones — the application's
  // authentication use case needs to know the difference.
  @Query("SELECT u FROM UserEntity u WHERE LOWER(u.username) = LOWER(:username)")
  Optional<UserEntity> findByUsername(@Param("username") String username);

  // Returns the user row by ID only if it is active. Used by the profile lookup.
  @Query("SELECT u FROM UserEntity u WHERE u.id = :id AND u.isActive = true")
  Optional<UserEntity> findActiveById(@Param("id") String id);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("UPDATE UserEntity u SET u.lastLoginAt = :now WHERE u.id = :id")
  void recordLogin(@Param("id") String id, @Param("now") Instant now);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("UPDATE UserEntity u SET u.isActive = :active WHERE u.id = :id")
  int setActive(@Param("id") String id, @Param("active") boolean active);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("UPDATE UserEntity u SET u.passwordHash = :hash WHERE u.id = :id")
  int updatePassword(@Param("id") String id, @Param("hash") String hash);
}
