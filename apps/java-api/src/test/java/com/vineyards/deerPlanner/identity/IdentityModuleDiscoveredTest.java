package com.vineyards.deerPlanner.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.vineyards.deerPlanner.DeerPlannerApplication;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class IdentityModuleDiscoveredTest {

  @Test
  void identityModule_whenInspected_isDiscovered() {
    ApplicationModules modules = ApplicationModules.of(DeerPlannerApplication.class);

    assertThat(modules.getModuleByName("identity")).isPresent();
  }
}
