package com.vineyards.deerPlanner.identity.application;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Typed configuration for the {@link IdentityBootstrap} component. Keys are read from the {@code
 * deerplanner.bootstrap.*} namespace and validated at boot (see ADR-16).
 */
@Validated
@ConfigurationProperties(prefix = "deerplanner.bootstrap")
@Getter
@Setter
public class BootstrapProperties {

  /**
   * Master switch. When {@code false} the bootstrap is skipped entirely — useful for tests and for
   * environments where the admin is provisioned out of band.
   */
  private boolean enabled = true;

  /** Username of the initial admin. Used both as the {@code users.username} and as the seed key. */
  @NotBlank private String username = "admin@deer";

  /** Human-readable display name shown in the UI. */
  @NotBlank private String displayName = "Administrator";

  /** Email associated with the initial admin. Defaults to the username to mirror the seed. */
  @NotBlank private String email = "admin@deer";

  /**
   * Optional pre-hashed (BCrypt) password for the initial admin. When set, this hash is stored
   * directly instead of generating a random password, so the admin credential is stable across
   * restarts/redeploys (e.g. supplied via the {@code DEERPLANNER_BOOTSTRAP_PASSWORDHASH} env var).
   * Never put a raw/plaintext password here — generate the hash once offline (e.g. {@code new
   * BCryptPasswordEncoder(12).encode("...")}) and store only the hash as a secret.
   */
  private String passwordHash;
}
