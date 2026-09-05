package com.vineyards.deerPlanner.audit.application;

import com.vineyards.deerPlanner.audit.application.port.AuditOutPort;
import com.vineyards.deerPlanner.audit.domain.AuditEntry;
import com.vineyards.deerPlanner.audit.facade.AuditInPort;
import com.vineyards.deerPlanner.audit.facade.dto.AuditEntryDto;
import com.vineyards.deerPlanner.audit.facade.dto.AuditEntryMapper;
import com.vineyards.deerPlanner.audit.facade.dto.EventActivitySummaryDto;
import com.vineyards.deerPlanner.shared.web.PagedResponse;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.jmolecules.architecture.hexagonal.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Read-side use cases for the audit bounded context. Writing is done asynchronously by {@link
 * AuditListener}; this service only exposes query operations.
 */
@Service
@Application
@RequiredArgsConstructor
public class AuditService implements AuditInPort {

  private final AuditOutPort audit;

  @Override
  @Transactional(readOnly = true)
  public PagedResponse<AuditEntryDto> listForEvent(
      String eventId, String resourceType, Pageable pageable) {
    Page<AuditEntry> page = audit.findByEventId(eventId, resourceType, pageable);
    return PagedResponse.from(page, AuditEntryMapper::toDto);
  }

  @Override
  @Transactional(readOnly = true)
  public EventActivitySummaryDto summaryForEvent(String eventId) {
    AuditEntry created = audit.findLatestByEventIdAndAction(eventId, "event.created").orElse(null);
    AuditEntry lastUpdate =
        audit.findByEventId(eventId, null, Pageable.ofSize(1)).stream()
            .filter(e -> !"event.created".equals(e.getAction()))
            .findFirst()
            .orElse(null);
    AuditEntry lastGuestCapture =
        audit.findGuestCaptureActions(eventId).stream().findFirst().orElse(null);

    Integer capturedCount = null;
    Instant capturedAt = null;
    if (lastGuestCapture != null && lastGuestCapture.getPayload() != null) {
      Object raw = lastGuestCapture.getPayload().get("guestsAdded");
      if (raw instanceof Number n) {
        capturedCount = n.intValue();
      }
      capturedAt = lastGuestCapture.getOccurredAt();
    }

    return new EventActivitySummaryDto(
        eventId,
        created == null ? null : created.getActorUserId(),
        created == null ? null : created.getOccurredAt(),
        lastUpdate == null ? null : lastUpdate.getActorUserId(),
        lastUpdate == null ? null : lastUpdate.getOccurredAt(),
        lastUpdate == null ? null : lastUpdate.getAction(),
        capturedAt,
        capturedCount == null ? 0 : capturedCount);
  }
}
