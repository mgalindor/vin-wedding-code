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

  Page<AuditEntry> findByEventId(String eventId, String resourceType, Pageable pageable);

  Optional<AuditEntry> findLatestByEventIdAndAction(String eventId, String action);

  List<AuditEntry> findGuestCaptureActions(String eventId);
}
