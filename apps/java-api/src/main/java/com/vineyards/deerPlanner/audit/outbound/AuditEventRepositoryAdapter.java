package com.vineyards.deerPlanner.audit.outbound;

import com.vineyards.deerPlanner.audit.application.port.AuditOutPort;
import com.vineyards.deerPlanner.audit.domain.AuditEntry;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

/**
 * Adapts {@link AuditOutPort} to PostgreSQL via the {@code audit_events} table. The application
 * never issues UPDATE/DELETE on this table — append-only by convention.
 */
@Component
@SecondaryAdapter
@RequiredArgsConstructor
@Slf4j
public class AuditEventRepositoryAdapter implements AuditOutPort {

  private static final int LATEST_SCAN = 20;

  private final AuditEventJpaRepository jpa;

  @Override
  public AuditEntry append(AuditEntry entry) {
    AuditEventEntity entity = toEntity(entry);
    AuditEventEntity saved = jpa.saveAndFlush(entity);
    return toDomain(saved);
  }

  @Override
  public Page<AuditEntryWithActor> findByEventIdWithActor(
      String eventId, String resourceType, Pageable pageable) {
    Page<AuditEventJpaRepository.AuditEntryWithActor> page =
        resourceType == null || resourceType.isBlank()
            ? jpa.findByEventIdWithActor(eventId, pageable)
            : jpa.findByEventIdAndResourceTypeWithActor(eventId, resourceType, pageable);
    return page.map(
        row -> new AuditEntryWithActor(toDomain(row.getEntry()), row.getActorDisplayName()));
  }

  @Override
  public Optional<AuditEntry> findLatestByEventIdAndAction(String eventId, String action) {
    return jpa.findLatestByEventIdAndAction(eventId, action, PageRequest.of(0, 1)).stream()
        .findFirst()
        .map(AuditEventRepositoryAdapter::toDomain);
  }

  @Override
  public List<AuditEntry> findGuestCaptureActions(String eventId) {
    return jpa.findGuestCaptureActions(eventId, PageRequest.of(0, LATEST_SCAN)).stream()
        .map(AuditEventRepositoryAdapter::toDomain)
        .toList();
  }

  static AuditEventEntity toEntity(AuditEntry e) {
    return AuditEventEntity.builder()
        .id(e.getId())
        .occurredAt(e.getOccurredAt())
        .actorUserId(e.getActorUserId())
        .actorKind(e.getActorKind())
        .action(e.getAction())
        .resourceType(e.getResourceType())
        .resourceId(e.getResourceId())
        .eventId(e.getEventId())
        .payload(e.getPayload())
        .traceId(e.getTraceId())
        .build();
  }

  static AuditEntry toDomain(AuditEventEntity e) {
    return AuditEntry.builder()
        .id(e.getId())
        .occurredAt(e.getOccurredAt())
        .actorUserId(e.getActorUserId())
        .actorKind(e.getActorKind())
        .action(e.getAction())
        .resourceType(e.getResourceType())
        .resourceId(e.getResourceId())
        .eventId(e.getEventId())
        .payload(e.getPayload())
        .traceId(e.getTraceId())
        .build();
  }
}
