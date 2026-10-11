package com.vineyards.deerPlanner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.context.annotation.ImportRuntimeHints;
import org.springframework.modulith.Modulith;

@SpringBootApplication
@Modulith(sharedModules = "shared")
@ConfigurationPropertiesScan
@ImportRuntimeHints({LiquibaseNativeRuntimeHints.class, HibernateNativeRuntimeHints.class})
public class DeerPlannerApplication {

  public static void main(String[] args) {
    SpringApplication.run(DeerPlannerApplication.class, args);
  }
}
