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

  /**
   * Same as {@link #findByEventId} but joins {@code users} so the FE can render the actor's {@code
   * displayName} without an N+1 lookup. Returns the entity + actor displayName as a projection;
   * missing actors (deleted users, system events) come back as {@code null}.
   */
  @Query(
      "select a as entry, u.displayName as actorDisplayName"
          + " from AuditEventEntity a left join UserEntity u on u.id = a.actorUserId"
          + " where a.eventId = :eventId")
  Page<AuditEntryWithActor> findByEventIdWithActor(
      @Param("eventId") String eventId, Pageable pageable);

  @Query(
      "select a as entry, u.displayName as actorDisplayName"
          + " from AuditEventEntity a left join UserEntity u on u.id = a.actorUserId"
          + " where a.eventId = :eventId and a.resourceType = :resourceType")
  Page<AuditEntryWithActor> findByEventIdAndResourceTypeWithActor(
      @Param("eventId") String eventId,
      @Param("resourceType") String resourceType,
      Pageable pageable);

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

  /** Projection used by the actor-hydrating queries above. */
  interface AuditEntryWithActor {
    AuditEventEntity getEntry();

    String getActorDisplayName();
  }
}
