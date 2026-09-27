package com.vineyards.deerPlanner.audit.application.port;

import com.vineyards.deerPlanner.audit.domain.AuditEntry;
import java.util.List;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.SecondaryPort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Secondary port for the audit bounded context. Owned by the application layer; implemented in
 * {@code audit/outbound/}.
 */
@SecondaryPort
public interface AuditOutPort {

  /** Persists a new audit row. Mints the XID inside the adapter. */
  AuditEntry append(AuditEntry entry);

  /**
   * Paged read for the activity feed. Returns {@link AuditEntryWithActor} so the BE can hand the FE
   * a single hydrated DTO (entry + actor displayName) without the FE having to do an N+1 {@code GET
   * /users/{id}} round-trip per row.
   */
  Page<AuditEntryWithActor> findByEventIdWithActor(
      String eventId, String resourceType, Pageable pageable);

  Optional<AuditEntry> findLatestByEventIdAndAction(String eventId, String action);

  List<AuditEntry> findGuestCaptureActions(String eventId);

  /**
   * Projection: the audit row plus the actor's {@code displayName} (or {@code null} if the user has
   * been deleted or the action was performed by a system actor).
   */
  record AuditEntryWithActor(AuditEntry entry, String actorDisplayName) {}
}
