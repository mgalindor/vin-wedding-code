package com.vineyards.deerPlanner.audit.outbound;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditEventJpaRepository extends JpaRepository<AuditEventEntity, String> {

  Page<AuditEventEntity> findByEventId(String eventId, Pageable pageable);

  Page<AuditEventEntity> findByEventIdAndResourceType(
      String eventId, String resourceType, Pageable pageable);

  @Query(
      "select a from AuditEventEntity a where a.eventId = :eventId and a.action = :action"
          + " order by a.occurredAt desc")
  List<AuditEventEntity> findLatestByEventIdAndAction(
      @Param("eventId") String eventId, @Param("action") String action, Pageable pageable);

  @Query(
      "select a from AuditEventEntity a"
          + " where a.eventId = :eventId"
          + " and a.action in ('guest.created', 'guest_group.created')"
          + " order by a.occurredAt desc")
  List<AuditEventEntity> findGuestCaptureActions(
      @Param("eventId") String eventId, Pageable pageable);
}
