package com.vineyards.deerPlanner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.modulith.Modulith;

@SpringBootApplication
@Modulith(sharedModules = "shared")
public class DeerPlannerApplication {

  public static void main(String[] args) {
    SpringApplication.run(DeerPlannerApplication.class, args);
  }
}
