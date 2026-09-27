package com.vineyards.deerPlanner.audit.facade.dto;

import com.vineyards.deerPlanner.audit.application.port.AuditOutPort.AuditEntryWithActor;
import com.vineyards.deerPlanner.audit.domain.ActorKind;
import com.vineyards.deerPlanner.audit.domain.AuditEntry;

public final class AuditEntryMapper {

  private AuditEntryMapper() {}

  /**
   * Maps a domain entry without actor hydration. Used by callers that already have the displayName
   * on hand (e.g. unit tests) or don't need it (the activity-summary endpoint, where the FE renders
   * IDs anyway).
   */
  public static AuditEntryDto toDto(AuditEntry e) {
    if (e == null) return null;
    return toDto(e, null);
  }

  /** Maps a hydrated row (entry + actor displayName) into the wire DTO. */
  public static AuditEntryDto toDto(AuditEntryWithActor row) {
    if (row == null) return null;
    return toDto(row.entry(), row.actorDisplayName());
  }

  private static AuditEntryDto toDto(AuditEntry e, String actorUserName) {
    return new AuditEntryDto(
        e.getId(),
        e.getOccurredAt(),
        e.getActorUserId(),
        actorUserName,
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
