package com.vineyards.deerPlanner;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class Arch001ModulithBoundariesTest {

  @Test
  void modulithBoundariesAreRespected() {
    ApplicationModules modules = ApplicationModules.of(DeerPlannerApplication.class);
    modules.verify();
  }
}
