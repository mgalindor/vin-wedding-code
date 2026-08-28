package com.vineyards.deerPlanner.shared.security;

import org.jmolecules.architecture.hexagonal.SecondaryPort;
import org.springframework.modulith.NamedInterface;

@SecondaryPort
@NamedInterface
public interface PasswordEncoderPort {

    boolean matches(String rawPassword, String storedHash);

    String hash(String rawPassword);
}
