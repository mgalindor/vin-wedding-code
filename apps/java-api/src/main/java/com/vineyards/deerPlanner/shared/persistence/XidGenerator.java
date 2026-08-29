package com.vineyards.deerPlanner.shared.persistence;

import static org.hibernate.generator.EventTypeSets.INSERT_ONLY;

import com.github.shamil.Xid;
import java.util.EnumSet;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.generator.BeforeExecutionGenerator;
import org.hibernate.generator.EventType;

public class XidGenerator implements BeforeExecutionGenerator {

  @Override
  public EnumSet<EventType> getEventTypes() {
    return INSERT_ONLY;
  }

  @Override
  public Object generate(
      SharedSessionContractImplementor session,
      Object owner,
      Object currentValue,
      EventType eventType) {
    return Xid.get().toString();
  }
}
