package com.vineyards.deerPlanner.audit.domain;

import java.time.Instant;
import java.util.Map;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuditEntry {

  private String id;

  private Instant occurredAt;

  private String actorUserId;

  private ActorKind actorKind;

  private String action;

  private String resourceType;

  private String resourceId;

  private String eventId;

  private Map<String, Object> payload;

  private String traceId;
}
