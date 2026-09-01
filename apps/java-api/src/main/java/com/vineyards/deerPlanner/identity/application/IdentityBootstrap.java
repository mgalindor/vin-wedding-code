package com.vineyards.deerPlanner.identity.application;

import com.vineyards.deerPlanner.identity.application.port.UserOutPort;
import com.vineyards.deerPlanner.identity.domain.Role;
import com.vineyards.deerPlanner.identity.domain.User;
import java.security.SecureRandom;
import java.util.EnumSet;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds the initial Administrator on first boot. Replaces the old Liquibase changeset that shipped
 * a placeholder password hash.
 *
 * <p>Behaviour: if no user with the configured username exists, a fresh row is created with both
 * the {@code Administrator} and {@code EventOrganizer} roles and a cryptographically random
 * 10-character alphanumeric password. The password is printed to the application log at WARN level
 * exactly once, framed by a banner that asks the operator to rotate it. If the user already exists,
 * the runner is a no-op.
 *
 * <p>Disable per-environment with {@code deerplanner.bootstrap.enabled=false} (default true).
 */
@Slf4j
@Component
@ConditionalOnProperty(
    prefix = "deerplanner.bootstrap",
    name = "enabled",
    havingValue = "true",
    matchIfMissing = true)
@EnableConfigurationProperties(BootstrapProperties.class)
@RequiredArgsConstructor
public class IdentityBootstrap implements CommandLineRunner {

  /**
   * 62-char alphanumeric alphabet (A-Z + a-z + 0-9). No symbols to keep copy-paste friction low.
   */
  private static final char[] PASSWORD_ALPHABET =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".toCharArray();

  private static final int PASSWORD_LENGTH = 10;

  /** {@link SecureRandom} is thread-safe and seeded from the OS entropy source. */
  private static final SecureRandom RANDOM = new SecureRandom();

  private final BootstrapProperties props;
  private final UserOutPort userRepository;
  private final PasswordEncoder passwordEncoder;

  @Override
  @Transactional
  public void run(String... args) {
    if (userRepository.findByUsername(props.getUsername()).isPresent()) {
      log.info("identity.bootstrap.skipped reason=user-exists username={}", props.getUsername());
      return;
    }

    String rawPassword = generatePassword();
    String hash = passwordEncoder.encode(rawPassword);
    Set<Role> roles = EnumSet.of(Role.Administrator, Role.EventOrganizer);

    User admin =
        User.builder()
            .username(props.getUsername())
            .displayName(props.getDisplayName())
            .email(props.getEmail())
            .passwordHash(hash)
            .isActive(true)
            .roles(roles)
            .build();

    User created = userRepository.create(admin);

    log.warn("================================================================================");
    log.warn("INITIAL ADMIN BOOTSTRAPPED — copy these values, they will not be shown again");
    log.warn("  username:     {}", created.getUsername());
    log.warn("  userId:       {}", created.getId());
    log.warn("  displayName:  {}", created.getDisplayName());
    log.warn("  temporary password: {}", rawPassword);
    log.warn("  CHANGE THIS PASSWORD AS SOON AS POSSIBLE (PUT /oauth/user/password).");
    log.warn("================================================================================");
  }

  /** 10-char alphanumeric string drawn uniformly from a 62-char alphabet via SecureRandom. */
  static String generatePassword() {
    StringBuilder sb = new StringBuilder(PASSWORD_LENGTH);
    for (int i = 0; i < PASSWORD_LENGTH; i++) {
      sb.append(PASSWORD_ALPHABET[RANDOM.nextInt(PASSWORD_ALPHABET.length)]);
    }
    return sb.toString();
  }
}
