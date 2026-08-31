package com.vineyards.deerPlanner;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

/**
 * Verifies Spring Modulith module boundaries. Types under {@code shared.persistence} (notably the
 * {@code @XidId} marker and {@code AuditorAwareImpl}) are intentionally referenced from every
 * module's JPA entities, so we ignore those specific violations.
 */
class Arch001ModulithBoundariesTest {

  @Test
  void modulithBoundariesAreRespected() {
    ApplicationModules modules = ApplicationModules.of(DeerPlannerApplication.class);
    modules
        .detectViolations()
        .filter(violation -> !violation.getMessage().contains("XidId"))
        .throwIfPresent();
  }
}
