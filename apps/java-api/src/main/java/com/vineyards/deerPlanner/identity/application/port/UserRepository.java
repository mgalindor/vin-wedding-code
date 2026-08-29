package com.vineyards.deerPlanner.identity.application.port;

import com.vineyards.deerPlanner.identity.domain.User;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

@SecondaryPort
public interface UserRepository {

  Optional<User> findByUsername(String username);

  Optional<User> findActiveById(String id);

  void recordLogin(String userId);
}
