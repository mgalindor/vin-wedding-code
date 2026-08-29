package com.vineyards.deerPlanner.shared.security;

import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@SecondaryAdapter
@Slf4j
public class BcryptPasswordEncoderAdapter implements PasswordEncoderPort {

  private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

  @Override
  public boolean matches(String rawPassword, String storedHash) {
    if (rawPassword == null || storedHash == null) {
      return false;
    }
    return encoder.matches(rawPassword, storedHash);
  }

  @Override
  public String hash(String rawPassword) {
    return encoder.encode(rawPassword);
  }
}
