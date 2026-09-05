package com.vineyards.deerPlanner.audit.application;

import com.vineyards.deerPlanner.audit.domain.ActorKind;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Resolves the actor of an audited action. Reads the SecurityContextHolder so the listener can stay
 * decoupled from where the action was triggered (HTTP, scheduled job, etc.).
 */
@Component
public class AuditActorResolver {

  public ResolvedActor resolve() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()) {
      return ResolvedActor.system();
    }
    if (auth.getPrincipal() instanceof Jwt jwt && jwt.getSubject() != null) {
      return ResolvedActor.user(jwt.getSubject());
    }
    String name = auth.getName();
    if (name == null || name.isBlank() || "anonymousUser".equals(name)) {
      return ResolvedActor.system();
    }
    return ResolvedActor.user(name);
  }

  public ResolvedActor invitation() {
    return new ResolvedActor(null, ActorKind.invitation);
  }

  public record ResolvedActor(String userId, ActorKind kind) {

    public static ResolvedActor user(String userId) {
      return new ResolvedActor(userId, ActorKind.user);
    }

    public static ResolvedActor system() {
      return new ResolvedActor(null, ActorKind.system);
    }
  }
}
