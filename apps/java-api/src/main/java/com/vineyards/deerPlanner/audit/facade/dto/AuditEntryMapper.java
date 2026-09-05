package com.vineyards.deerPlanner.audit.facade.dto;

import com.vineyards.deerPlanner.audit.domain.ActorKind;
import com.vineyards.deerPlanner.audit.domain.AuditEntry;

public final class AuditEntryMapper {

  private AuditEntryMapper() {}

  public static AuditEntryDto toDto(AuditEntry e) {
    if (e == null) return null;
    return new AuditEntryDto(
        e.getId(),
        e.getOccurredAt(),
        e.getActorUserId(),
        e.getActorKind() == null ? null : e.getActorKind().name(),
        e.getAction(),
        e.getResourceType(),
        e.getResourceId(),
        e.getEventId(),
        e.getPayload());
  }

  public static ActorKind parseKind(String value) {
    return value == null ? null : ActorKind.valueOf(value);
  }
}
