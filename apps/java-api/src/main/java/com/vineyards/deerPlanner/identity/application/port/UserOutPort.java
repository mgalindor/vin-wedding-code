package com.vineyards.deerPlanner.identity.application.port;

import com.vineyards.deerPlanner.identity.domain.User;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

@SecondaryPort
public interface UserOutPort {

  Optional<User> findByUsername(String username);

  Optional<User> findActiveById(String id);

  void recordLogin(String userId);

  /**
   * Persist a new user and its role assignments. The {@code id} field is ignored — Hibernate's
   * {@code @XidId} generator fills it on insert. Returns the persisted domain object with the
   * generated id and the timestamps populated.
   */
  User create(User user);
}
