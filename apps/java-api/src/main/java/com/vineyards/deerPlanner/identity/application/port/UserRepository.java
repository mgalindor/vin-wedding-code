package com.vineyards.deerPlanner.identity.application.port;

import com.vineyards.deerPlanner.identity.domain.User;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

import java.util.Optional;

@SecondaryPort
public interface UserRepository {

    Optional<User> findByUsername(String username);

    Optional<User> findActiveById(String id);

    void recordLogin(String userId);
}
