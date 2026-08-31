package com.vineyards.deerPlanner;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import org.jmolecules.archunit.JMoleculesArchitectureRules;

@AnalyzeClasses(
    packages = "com.vineyards.deerPlanner",
    importOptions = ImportOption.DoNotIncludeTests.class)
class HexagonalBoundariesTest {

  @ArchTest
  static final ArchRule hexagonalArchitecture = JMoleculesArchitectureRules.ensureHexagonal();
}
