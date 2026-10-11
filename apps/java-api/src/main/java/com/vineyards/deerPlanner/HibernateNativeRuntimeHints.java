package com.vineyards.deerPlanner;

import org.springframework.aot.hint.MemberCategory;
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;

/**
 * Hibernate resolves its {@code StateManagement} singletons (e.g. for {@code @SoftDelete}) by
 * reflectively reading each implementation's static {@code INSTANCE} field, which GraalVM can't
 * discover through static analysis.
 */
class HibernateNativeRuntimeHints implements RuntimeHintsRegistrar {

  private static final Class<?>[] TYPES = {
    org.hibernate.persister.state.internal.StandardStateManagement.class,
    org.hibernate.persister.state.internal.SoftDeleteStateManagement.class,
    org.hibernate.persister.state.internal.AuditStateManagement.class,
    org.hibernate.persister.state.internal.HistoryStateManagement.class,
    org.hibernate.persister.state.internal.NativeTemporalStateManagement.class,
    org.hibernate.persister.state.internal.TemporalStateManagement.class,
  };

  @Override
  public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
    for (Class<?> type : TYPES) {
      hints.reflection().registerType(type, MemberCategory.ACCESS_DECLARED_FIELDS);
    }
  }
}
