package com.vineyards.deerPlanner.shared.persistence;

import java.util.Optional;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Provides the current actor's identifier for {@link
 * org.springframework.data.jpa.domain.support.AuditingEntityListener}. Returns {@code "system"}
 * when no authenticated user is in the security context (background jobs, bootstrapping).
 */
@Component
public class AuditorAwareImpl implements AuditorAware<String> {

  @Override
  public Optional<String> getCurrentAuditor() {
    var authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated()) {
      return Optional.of("system");
    }
    if (authentication.getPrincipal() instanceof Jwt jwt) {
      return Optional.ofNullable(jwt.getSubject());
    }
    return Optional.of(authentication.getName());
  }
}
