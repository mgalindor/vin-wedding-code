package com.vineyards.deerPlanner;

import org.springframework.aot.hint.MemberCategory;
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;

/**
 * Liquibase maps changelog attributes (e.g. {@code splitStatements}) onto Change setters via plain
 * reflection at parse time, so GraalVM can't discover those calls through static analysis. The
 * community-maintained reachability metadata only covers a subset of them, so we register full
 * reflective access ourselves for every Liquibase change/parameter type used by our changelogs.
 *
 * <p>Kept in the root package (not a module) since it's an application-wide native-image concern,
 * not shared-module business code — keeping it elsewhere would be an unexposed-type violation.
 */
class LiquibaseNativeRuntimeHints implements RuntimeHintsRegistrar {

  private static final Class<?>[] TYPES = {
    liquibase.change.AbstractSQLChange.class,
    liquibase.change.core.RawSQLChange.class,
    liquibase.change.core.CreateTableChange.class,
    liquibase.change.core.CreateIndexChange.class,
    liquibase.change.core.AddPrimaryKeyChange.class,
    liquibase.change.core.AddColumnChange.class,
    liquibase.change.core.DropColumnChange.class,
    liquibase.change.core.AddForeignKeyConstraintChange.class,
    liquibase.change.core.ModifyDataTypeChange.class,
    liquibase.change.core.AddNotNullConstraintChange.class,
    liquibase.change.ColumnConfig.class,
    liquibase.change.AddColumnConfig.class,
    liquibase.change.ConstraintsConfig.class,
  };

  @Override
  public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
    for (Class<?> type : TYPES) {
      hints
          .reflection()
          .registerType(
              type,
              MemberCategory.INVOKE_DECLARED_CONSTRUCTORS,
              MemberCategory.INVOKE_DECLARED_METHODS);
    }
  }
}
