package com.vineyards.deerPlanner.identity.application.port;

import com.vineyards.deerPlanner.identity.domain.User;
import com.vineyards.deerPlanner.identity.outbound.UserEntity;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

@SecondaryPort
public interface UserOutPort {

  Optional<User> findByUsername(String username);

  Optional<User> findActiveById(String id);

  /**
   * Returns the user regardless of {@code isActive} or {@code deleted} state. Used by admin-only
   * operations (disable, enable, role update) that must reach soft-deleted rows.
   */
  Optional<User> findById(String id);

  void recordLogin(String userId);

  /** Persist a new user. Hibernate generates the id via {@code @XidId}. */
  User create(User user);

  /** Replace an existing user's mutable fields. Id, username, createdAt are immutable. */
  User update(User user);

  /** Flip {@code is_active} for the given user. No-op when the value already matches. */
  void setActive(String id, boolean active);

  /**
   * Updates only the password hash. Used by the self-service password change flow so the caller
   * doesn't have to re-supply every other mutable field.
   */
  void updatePassword(String id, String passwordHash);

  /**
   * Soft-deletes the user. Hibernate {@code @SoftDelete} translates the row delete into an update
   * of the {@code deleted} column; the user disappears from every subsequent JPA query.
   */
  void delete(String id);

  /**
   * Paginated, filterable search over every non-soft-deleted user. The specification is built by
   * the service from the admin's filter parameters (q, role, isActive). Page contents are mapped to
   * the domain {@link User} type.
   */
  org.springframework.data.domain.Page<User> search(
      org.springframework.data.jpa.domain.Specification<UserEntity> spec,
      org.springframework.data.domain.Pageable pageable);

  /**
   * Lightweight existence check for cross-module flows. Returns false for unknown, soft-deleted, or
   * disabled users. Implemented via {@code findActiveById(...).isPresent()}.
   */
  boolean existsActiveById(String id);
}
