package com.vineyards.deerPlanner.audit.facade;

import com.vineyards.deerPlanner.audit.facade.dto.AuditEntryDto;
import com.vineyards.deerPlanner.audit.facade.dto.EventActivitySummaryDto;
import com.vineyards.deerPlanner.shared.web.PagedResponse;
import org.jmolecules.architecture.hexagonal.PrimaryPort;
import org.springframework.data.domain.Pageable;

/**
 * Primary port for the audit bounded context. Lets the FE (or admin tooling) pull recent activity
 * on an event without coupling to the persistence model.
 *
 * <p>Reads only — the bounded context's job is to record what other modules publish; it does not
 * expose a "create" verb to other modules.
 */
@PrimaryPort
public interface AuditInPort {

  PagedResponse<AuditEntryDto> listForEvent(String eventId, String resourceType, Pageable pageable);

  EventActivitySummaryDto summaryForEvent(String eventId);
}
