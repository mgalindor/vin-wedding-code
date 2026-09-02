package com.vineyards.deerPlanner.identity.application.port;

import com.vineyards.deerPlanner.identity.domain.User;
import java.util.List;
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
   * Returns every non-soft-deleted user, active or not. Admin-only listing — no pagination in MVP.
   */
  List<User> findAll();
}
