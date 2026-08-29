package com.vineyards.deerPlanner.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.vineyards.deerPlanner.DeerPlannerApplication;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class Arch002IdentityModuleDiscoveredTest {

  @Test
  void identityModuleIsDiscovered() {
    ApplicationModules modules = ApplicationModules.of(DeerPlannerApplication.class);

    assertThat(modules.getModuleByName("identity")).isPresent();
  }
}
