package com.vineyards.deerPlanner.audit.outbound;

import com.vineyards.deerPlanner.audit.domain.ActorKind;
import com.vineyards.deerPlanner.shared.persistence.XidId;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "audit_events")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuditEventEntity {

  @Id @XidId private String id;

  @Column(name = "occurred_at", nullable = false)
  private Instant occurredAt;

  @Column(name = "actor_user_id")
  private String actorUserId;

  @Enumerated(EnumType.STRING)
  @Column(name = "actor_kind", nullable = false)
  private ActorKind actorKind;

  @Column(name = "action", nullable = false)
  private String action;

  @Column(name = "resource_type", nullable = false)
  private String resourceType;

  @Column(name = "resource_id")
  private String resourceId;

  @Column(name = "event_id")
  private String eventId;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "payload", columnDefinition = "jsonb")
  private Map<String, Object> payload;

  @Column(name = "trace_id")
  private String traceId;
}
