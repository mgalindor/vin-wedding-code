package com.vineyards.deerPlanner.identity.application;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Typed configuration for the identity module. Keys live under the {@code deerplanner.identity.*}
 * namespace (ADR-16).
 */
@Validated
@ConfigurationProperties(prefix = "deerplanner.identity")
@Getter
@Setter
public class IdentityProperties {

  /**
   * Suffix appended to the username slug at create-time. The frontend sends {@code "miguel"}; the
   * backend stores {@code miguel@deer}. Configurable so a future rebrand can flip it without code
   * changes.
   */
  @NotBlank private String usernameSuffix = "@deer";

  /**
   * Username of the seeded administrator. Hardcoded reference used by the user-management service
   * to refuse disabling the default admin (Rule 17, ADR-05). Keep in sync with {@link
   * BootstrapProperties#getUsername()}.
   */
  @NotBlank private String protectedDefaultAdmin = "admin@deer";
}
